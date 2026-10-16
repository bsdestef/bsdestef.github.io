// Fetches the snowboarding data from the JSON file and returns it as an object.
// The path is relative to index.html (the page that loads this script), not to main.js.
async function fetchBoardingData() {
  const response = await fetch("js/boardingData.json");
  if (!response.ok) {
    throw new Error(`Failed to load boardingData.json (HTTP ${response.status})`);
  }
  return response.json();
}

// Fills a group of existing cards with new titles and descriptions.
// Only the text of each card's own h3 and p is changed; no elements are added or removed.
function updateCards(selector, cards) {
  const cardElements = document.querySelectorAll(selector);
  for (let i = 0; i < cardElements.length; i++) {
    cardElements[i].querySelector("h3").textContent = cards[i].title;
    cardElements[i].querySelector("p").textContent = cards[i].description;
  }
}

// Switches the page from skiing to snowboarding using the fetched data.
// It only changes text and the hero background image; the footer is left alone.
function updatePage(data) {
  document.title = data.title;
  document.getElementById("styleName").textContent = data.header;

  // Hero text and background image (--hero-img is the CSS variable used by .hero)
  document.getElementById("heroTitle").textContent = data.hero.headline;
  document.getElementById("heroDesc").textContent = data.hero.description;
  document.getElementById("heroSection").style.setProperty("--hero-img", `url("${data.hero.image}")`);

  // Section 1: Overview
  document.getElementById("sec1Title").textContent = data.sections.overview.title;
  document.getElementById("sec1Subtitle").textContent = data.sections.overview.subtitle;
  updateCards("#sec1Grid .card", data.sections.overview.cards);

  // Section 2: Equipment
  document.getElementById("sec2Title").textContent = data.sections.equipment.title;
  document.getElementById("sec2Subtitle").textContent = data.sections.equipment.subtitle;
  updateCards("#sec2Grid .card", data.sections.equipment.cards);
}

// When the "Change" button is clicked, load the data and update the page.
document.getElementById("changeThemeBtn").addEventListener("click", async () => {
  try {
    const data = await fetchBoardingData();
    updatePage(data);
  } catch (error) {
    console.error("Could not switch to snowboarding:", error);
  }
});
