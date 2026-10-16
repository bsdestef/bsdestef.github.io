// Loads the space data from the JSON file and returns it as an object.
async function fetchSpaceData() {
    const response = await fetch("js/spaceData.json");
    if (!response.ok) {
        throw new Error("Could not load space data");
    }

    return response.json();
}

// Shows one button for each category inside the explorer section.
// categories: the array of category objects from spaceData.json
function renderCategories(categories) {
    const explorerSection = document.getElementById("explorer");
    explorerSection.innerHTML = "";

    for (const category of categories) {
        const categoryButton = document.createElement("button");
        categoryButton.textContent = category.name;
        categoryButton.dataset.categoryId = category.id;
        explorerSection.appendChild(categoryButton);
    }
}

// Loads the space data and shows the categories, or an error message if loading fails.
async function loadExplorer() {
    try {
        const spaceData = await fetchSpaceData();
        renderCategories(spaceData.categories);
    } catch (error) {
        const explorerSection = document.getElementById("explorer");
        explorerSection.textContent = "Sorry, the space data couldn't load. Please refresh the page.";
    }
}

loadExplorer();

