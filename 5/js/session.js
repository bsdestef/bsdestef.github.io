// Runs on every page. It keeps the "Signed in as…" bar in the header up to date,
// handles the Log Out button, and keeps signed-out visitors off the pages that
// need an account (everything except the Home page) by sending them to log in.

import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { createElement, setButtonBusy, showError } from "./ui.js";

// Pages that need an account. After logging in, a visitor can be sent back to one of these.
export const PROTECTED_PAGES = ["explore.html", "about.html", "contact.html", "account.html"];

const HOME_PAGE = "index.html";
const USER_BAR_ID = "userBar";
const AUTH_GATE_ID = "authGate";
const PAGE_CONTENT_ID = "pageContent";

// Protected pages mark their <body> with data-access="protected".
const isProtectedPage = document.body.dataset.access === "protected";

// True while logging out, so the page guard doesn't also redirect.
let isLoggingOut = false;

// Resolves with the signed-in user once Firebase confirms who is signed in.
let resolveSignedInUser;
const signedInUser = new Promise((resolve) => {
    resolveSignedInUser = resolve;
});

// Returns the current page's file name, for example "explore.html".
function getCurrentPageName() {
    return window.location.pathname.split("/").pop() || HOME_PAGE;
}

// Returns the name to greet the user with: their display name, or their email.
export function getUserName(user) {
    return user.displayName || user.email;
}

// Signs the user out, then shows the Home page with a "you've been logged out" message.
// button: the Log Out button that was clicked (shows a spinner while working).
export async function logOut(button) {
    isLoggingOut = true;
    setButtonBusy(button, true, "Logging out…");
    try {
        await signOut(auth);
        window.location.href = `${HOME_PAGE}?loggedOut=1`;
    } catch (error) {
        isLoggingOut = false;
        setButtonBusy(button, false);
        const userBar = document.getElementById(USER_BAR_ID);
        const errorArea = createElement("div", "user-bar-error");
        userBar.appendChild(errorArea);
        showError(errorArea, "Couldn't log out.", error);
    }
}

// Fills the header bar: the user's name and a Log Out button, or a Log In link when signed out.
function renderUserBar(user) {
    const userBar = document.getElementById(USER_BAR_ID);
    userBar.textContent = "";

    if (user) {
        const label = createElement("span", "user-label", "Signed in as ");
        label.appendChild(createElement("strong", "", getUserName(user)));

        const logoutButton = createElement("button", "logout-button", "Log Out");
        logoutButton.type = "button";
        logoutButton.addEventListener("click", () => logOut(logoutButton));

        userBar.append(label, logoutButton);
    } else {
        const loginLink = createElement("a", "login-link", "Log In or Sign Up");
        loginLink.href = `${HOME_PAGE}#authCard`;
        userBar.append(createElement("span", "user-label", "You're not signed in."), loginLink);
    }
}

// Hides the "Checking your sign-in…" spinner and shows the page's real content.
function showProtectedContent() {
    document.getElementById(AUTH_GATE_ID).hidden = true;
    document.getElementById(PAGE_CONTENT_ID).hidden = false;
}

// Sends a signed-out visitor to the Home page to log in, remembering where they were going.
function sendToLogin() {
    window.location.replace(`${HOME_PAGE}?next=${encodeURIComponent(getCurrentPageName())}`);
}

// Firebase calls this when the page loads (once it knows who is signed in)
// and again whenever the user logs in or out, even in another tab.
onAuthStateChanged(auth, (user) => {
    renderUserBar(user);

    if (!isProtectedPage || isLoggingOut) {
        return;
    }
    if (user) {
        showProtectedContent();
        resolveSignedInUser(user);
    } else {
        sendToLogin();
    }
});

// Page scripts call this to wait until the user is confirmed signed in before loading anything.
// (Signed-out visitors are redirected to the Home page instead, so it never resolves for them.)
export function requireUser() {
    return signedInUser;
}
