// Shared helpers for building page elements and giving the user feedback:
// spinners while Firebase is working, plus error and success messages shown on the page.

const REQUEST_TIMEOUT_MS = 15000;

// Plain-English versions of common Firebase error codes.
// Any code not listed here falls back to Firebase's own error message.
const FRIENDLY_ERRORS = {
    "auth/invalid-email": "That email address doesn't look right. Check it for typos.",
    "auth/missing-email": "Please enter your email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/invalid-credential": "The email or password is incorrect. Please try again.",
    "auth/invalid-login-credentials": "The email or password is incorrect. Please try again.",
    "auth/wrong-password": "The email or password is incorrect. Please try again.",
    "auth/user-not-found": "The email or password is incorrect. Please try again.",
    "auth/user-disabled": "This account has been turned off. Contact us if you think this is a mistake.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
    "auth/weak-password": "Your password needs to be at least 6 characters long.",
    "auth/too-many-requests": "Too many attempts in a row. Please wait a few minutes and try again.",
    "auth/network-request-failed": "We couldn't reach Firebase. Check your internet connection and try again.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before you finished.",
    "auth/cancelled-popup-request": "The Google sign-in window was closed before you finished.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
    "auth/account-exists-with-different-credential": "An account already uses this email with a different sign-in method. Log in with your email and password instead.",
    "auth/requires-recent-login": "For your security, please log out, log back in, and then try again.",
    "auth/operation-not-allowed": "This sign-in method isn't turned on for Space Explorer yet.",
    "auth/unauthorized-domain": "Google sign-in isn't set up for this web address yet.",
    "timeout": "Firebase is taking too long to respond. Check your internet connection and try again.",
    "PERMISSION_DENIED": "You don't have permission to do that. Try logging out and back in."
};

// Creates and returns an element with the given tag, optional class name, and optional text.
export function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
}

// Creates the animated spinner icon. It is decorative, so screen readers skip it
// (the text next to it says what is happening).
export function createSpinner() {
    const spinner = createElement("span", "spinner");
    spinner.setAttribute("aria-hidden", "true");
    return spinner;
}

// Creates a "working…" message with a spinner that screen readers announce.
export function createLoadingMessage(text) {
    const loadingMessage = createElement("p", "loading");
    loadingMessage.setAttribute("role", "status");
    loadingMessage.append(createSpinner(), createElement("span", "", text));
    return loadingMessage;
}

// While a request is running: disables the button and shows a spinner and busyText inside it.
// When it finishes: puts the button back the way it was.
export function setButtonBusy(button, isBusy, busyText) {
    if (isBusy) {
        button.dataset.label = button.textContent;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.textContent = "";
        button.append(createSpinner(), busyText);
    } else {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = button.dataset.label;
    }
}

// Rejects with a "timeout" error if the promise takes longer than REQUEST_TIMEOUT_MS,
// so the user never waits forever when the network is down.
export function withTimeout(promise) {
    let timer;
    const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            const error = new Error("The request to Firebase timed out.");
            error.code = "timeout";
            reject(error);
        }, REQUEST_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Returns the Firebase error code, or a matching code for database errors that only have a message.
function getErrorCode(error) {
    if (error.code) {
        return error.code;
    }
    if (/permission.denied/i.test(error.message || "")) {
        return "PERMISSION_DENIED";
    }
    return "";
}

// Turns a Firebase error into a sentence the user can understand.
// overrides: optional { code: message } pairs for messages that depend on the page.
export function describeError(error, overrides = {}) {
    const code = getErrorCode(error);
    return overrides[code] || FRIENDLY_ERRORS[code] || error.message || "Something went wrong. Please try again.";
}

// Empties a status area.
export function clearStatus(statusArea) {
    statusArea.textContent = "";
}

// Shows a message box in a status area and returns it.
// type: "error", "success", or "info". title: short bold lead-in. detail: optional small print.
export function showStatus(statusArea, type, title, message, detail) {
    clearStatus(statusArea);
    const statusBox = createElement("div", `status status-${type}`);
    statusBox.setAttribute("role", type === "error" ? "alert" : "status");

    const text = createElement("p");
    if (title) {
        text.append(createElement("strong", "status-title", title), " ");
    }
    text.append(message);
    statusBox.appendChild(text);

    if (detail) {
        statusBox.appendChild(createElement("p", "status-detail", detail));
    }
    statusArea.appendChild(statusBox);
    return statusBox;
}

// Shows a Firebase error on the page (never with window.alert), including the
// error code Firebase sent so the problem is easy to look up.
export function showError(statusArea, title, error, overrides) {
    const code = getErrorCode(error);
    const detail = code && code !== "timeout" ? `Firebase error code: ${code}` : "";
    return showStatus(statusArea, "error", title, describeError(error, overrides), detail);
}
