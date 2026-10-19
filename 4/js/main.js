// Space Explorer: interactive two-step explorer.
// Step 1 shows the categories, step 2 shows the objects in a category,
// and choosing an object shows all of its details. Everything is built
// from spaceData.json, so the page never navigates away (no hrefs).

const DATA_URL = "js/spaceData.json";
const EXPLORER_ID = "explorer";
const LOAD_ERROR_MESSAGE = "Sorry, the space data couldn't load. Please check your connection and refresh the page.";

// Loads the space data from the JSON file and returns it as an object.
// Throws an Error if the server responds with an error status (for example 404).
async function fetchSpaceData() {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
        throw new Error(`Could not load space data (HTTP ${response.status})`);
    }

    return response.json();
}

// Empties the explorer section and returns it, ready for new content.
function clearExplorer() {
    const explorerSection = document.getElementById(EXPLORER_ID);
    explorerSection.innerHTML = "";
    return explorerSection;
}

// Creates and returns an element with the given tag, optional class name, and optional text.
function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
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
function focusViewHeading(explorerSection) {
    const heading = explorerSection.querySelector(".view-heading");
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
// items: array of values; renderItem turns one value into the content of one <li>.
function createListSection(title, items, renderItem) {
    const section = createElement("section", "detail-section");
    const list = createElement("ul");

    for (const item of items) {
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
    return sourceLink;
}

// Step 3: shows every detail of one object (image, overview, facts, quick facts, sources).
// Back buttons return to the object list for its category or to all categories.
function renderObjectDetail(spaceObject, category, categories) {
    const explorerSection = clearExplorer();

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

    explorerSection.append(backButtons, createViewHeading(spaceObject.name), detailLayout);
    focusViewHeading(explorerSection);
}

// Step 2: shows a card for each of the 4 objects in the chosen category.
function renderObjects(category, categories) {
    const explorerSection = clearExplorer();
    const cardGrid = createElement("div", "card-grid");

    for (const spaceObject of category.objects) {
        cardGrid.appendChild(createChoiceCard(
            spaceObject.image, spaceObject.alt, spaceObject.name, spaceObject.blurb,
            () => renderObjectDetail(spaceObject, category, categories)
        ));
    }

    explorerSection.append(
        createBackButton("← All categories", () => renderCategories(categories, true)),
        createViewHeading(category.name),
        createElement("p", "view-intro", category.description),
        cardGrid
    );
    focusViewHeading(explorerSection);
}

// Step 1: shows a card for each category. Choosing one shows that category's objects.
// categories: the array of category objects from spaceData.json
// moveFocus: true when returning from another view, so focus isn't lost (false on first load)
function renderCategories(categories, moveFocus = false) {
    const explorerSection = clearExplorer();
    const cardGrid = createElement("div", "card-grid");

    for (const category of categories) {
        cardGrid.appendChild(createChoiceCard(
            category.image, category.alt, category.name, category.description,
            () => renderObjects(category, categories)
        ));
    }

    explorerSection.append(
        createViewHeading("Choose a category"),
        cardGrid
    );
    if (moveFocus) {
        focusViewHeading(explorerSection);
    }
}

// Loads the space data and shows the categories, or an error message on the page if loading fails.
async function loadExplorer() {
    try {
        const spaceData = await fetchSpaceData();
        renderCategories(spaceData.categories);
    } catch (error) {
        const explorerSection = clearExplorer();
        explorerSection.appendChild(createElement("p", "error-message", LOAD_ERROR_MESSAGE));
    }
}

loadExplorer();
