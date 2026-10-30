// Space Explorer: interactive two-step explorer.
// Step 1 shows the categories, step 2 shows the objects in a category,
// and choosing an object shows all of its details. Everything is built from
// the space data stored in our Firebase Realtime Database, which is only
// loaded after Firebase confirms the user is signed in.

import { database, ref, get } from "./firebase.js";
import { requireUser } from "./session.js";
import { createElement, createLoadingMessage, withTimeout, describeError } from "./ui.js";

const DATA_PATH = "spaceData";
const EXPLORER_ID = "explorer";

// Loads the space data from Firebase and returns it as an object.
// Throws an Error if the request fails, times out, or the data is missing.
async function fetchSpaceData() {
    const snapshot = await withTimeout(get(ref(database, DATA_PATH)));
    if (!snapshot.exists()) {
        throw new Error("The space data wasn't found in the database.");
    }
    return snapshot.val();
}

// Firebase can hand lists back as objects ({ "0": …, "1": … }),
// so this turns either form into a normal array.
function toArray(list) {
    if (Array.isArray(list)) {
        return list;
    }
    return list ? Object.values(list) : [];
}

// Empties the explorer area and returns it, ready for new content.
function clearExplorer() {
    const explorerArea = document.getElementById(EXPLORER_ID);
    explorerArea.textContent = "";
    return explorerArea;
}

// Creates the heading for the current view. tabindex="-1" lets us move keyboard
// and screen-reader focus to it after the content changes.
function createViewHeading(text) {
    const heading = createElement("h2", "view-heading", text);
    heading.tabIndex = -1;
    return heading;
}

// Moves focus to the new view's heading so screen-reader and keyboard users
// know the content changed, and scrolls it into view on small screens.
function focusViewHeading(explorerArea) {
    const heading = explorerArea.querySelector(".view-heading");
    heading.focus();
    heading.scrollIntoView({ block: "start" });
}

// Creates a large clickable card (a real <button>) with an image, a title, and a short description.
// onSelect: the function to run when the card is clicked or tapped.
function createChoiceCard(imageSource, imageAlt, title, description, onSelect) {
    const cardButton = createElement("button", "choice-card");
    cardButton.type = "button";

    const cardImage = createElement("img");
    cardImage.src = imageSource;
    cardImage.alt = imageAlt;

    cardButton.append(
        cardImage,
        createElement("span", "choice-title", title),
        createElement("span", "choice-text", description)
    );
    cardButton.addEventListener("click", onSelect);
    return cardButton;
}

// Creates a "back" button that runs onBack when clicked.
function createBackButton(label, onBack) {
    const backButton = createElement("button", "back-button", label);
    backButton.type = "button";
    backButton.addEventListener("click", onBack);
    return backButton;
}

// Creates a titled section containing a bulleted list.
// items: list of values; renderItem turns one value into the content of one <li>.
function createListSection(title, items, renderItem) {
    const section = createElement("section", "detail-section");
    const list = createElement("ul");

    for (const item of toArray(items)) {
        const listItem = createElement("li");
        listItem.append(...renderItem(item));
        list.appendChild(listItem);
    }

    section.append(createElement("h3", "", title), list);
    return section;
}

// Creates the figure with the object's image, caption, and image credit.
function createObjectFigure(spaceObject) {
    const figure = createElement("figure", "detail-figure");
    const objectImage = createElement("img");
    objectImage.src = spaceObject.image;
    objectImage.alt = spaceObject.alt;

    const caption = createElement("figcaption", "", spaceObject.caption + " ");
    caption.appendChild(createElement("cite", "", spaceObject.credit));

    figure.append(objectImage, caption);
    return figure;
}

// Creates a link to a source that opens in a new tab.
function createSourceLink(source) {
    const sourceLink = createElement("a", "", source.text);
    sourceLink.href = source.url;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener";
    sourceLink.appendChild(createElement("span", "visually-hidden", " (opens in a new tab)"));
    return sourceLink;
}

// Step 3: shows every detail of one object (image, overview, facts, quick facts, sources).
// Back buttons return to the object list for its category or to all categories.
function renderObjectDetail(spaceObject, category, categories) {
    const explorerArea = clearExplorer();

    const backButtons = createElement("div", "back-buttons");
    backButtons.append(
        createBackButton(`← Back to ${category.name}`, () => renderObjects(category, categories)),
        createBackButton("All categories", () => renderCategories(categories, true))
    );

    const overviewSection = createElement("section", "detail-section");
    overviewSection.append(
        createElement("h3", "", "Overview"),
        createElement("p", "", spaceObject.overview)
    );

    const factsSection = createListSection("Interesting Facts", spaceObject.facts,
        (fact) => [fact]);

    const quickFactsSection = createListSection("Quick Facts", spaceObject.quickFacts,
        (quickFact) => [createElement("strong", "", `${quickFact.label}:`), ` ${quickFact.value}`]);

    const sourcesSection = createListSection("Sources", spaceObject.sources,
        (source) => [createSourceLink(source)]);

    const detailText = createElement("div", "detail-text");
    detailText.append(overviewSection, factsSection, quickFactsSection, sourcesSection);

    const detailLayout = createElement("div", "detail-layout");
    detailLayout.append(createObjectFigure(spaceObject), detailText);

    explorerArea.append(backButtons, createViewHeading(spaceObject.name), detailLayout);
    focusViewHeading(explorerArea);
}

// Step 2: shows a card for each object in the chosen category.
function renderObjects(category, categories) {
    const explorerArea = clearExplorer();
    const cardGrid = createElement("div", "card-grid");

    for (const spaceObject of toArray(category.objects)) {
        cardGrid.appendChild(createChoiceCard(
            spaceObject.image, spaceObject.alt, spaceObject.name, spaceObject.blurb,
            () => renderObjectDetail(spaceObject, category, categories)
        ));
    }

    explorerArea.append(
        createBackButton("← All categories", () => renderCategories(categories, true)),
        createViewHeading(category.name),
        createElement("p", "view-intro", `${category.description} Choose one to learn more.`),
        cardGrid
    );
    focusViewHeading(explorerArea);
}

// Step 1: shows a card for each category. Choosing one shows that category's objects.
// categories: the list of category objects from the database
// moveFocus: true when returning from another view, so focus isn't lost (false on first load)
function renderCategories(categories, moveFocus = false) {
    const explorerArea = clearExplorer();
    const cardGrid = createElement("div", "card-grid");

    for (const category of categories) {
        cardGrid.appendChild(createChoiceCard(
            category.image, category.alt, category.name, category.description,
            () => renderObjects(category, categories)
        ));
    }

    explorerArea.append(
        createViewHeading("Step 1: Choose a category"),
        cardGrid
    );
    if (moveFocus) {
        focusViewHeading(explorerArea);
    }
}

// Shows what went wrong on the page, with a Try Again button.
function renderLoadError(error) {
    const explorerArea = clearExplorer();
    const errorBox = createElement("div", "status status-error");
    errorBox.setAttribute("role", "alert");

    const message = createElement("p");
    message.append(createElement("strong", "status-title", "Sorry, the space data couldn't load."), " ", describeError(error));
    errorBox.appendChild(message);
    if (error.code && error.code !== "timeout") {
        errorBox.appendChild(createElement("p", "status-detail", `Firebase error code: ${error.code}`));
    }

    const retryButton = createElement("button", "", "Try Again");
    retryButton.type = "button";
    retryButton.addEventListener("click", loadExplorer);
    errorBox.appendChild(retryButton);

    explorerArea.appendChild(errorBox);
}

// Shows a spinner, loads the space data from Firebase, then shows the categories
// (or an error message on the page if loading fails).
async function loadExplorer() {
    const explorerArea = clearExplorer();
    explorerArea.appendChild(createLoadingMessage("Loading space data from the database…"));

    try {
        const spaceData = await fetchSpaceData();
        renderCategories(toArray(spaceData.categories));
    } catch (error) {
        renderLoadError(error);
    }
}

requireUser().then(loadExplorer);
