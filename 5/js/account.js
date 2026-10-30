// Account page: shows the user's account details and lets them change their password.
// Email/password accounts change it here through Firebase. Google accounts are told to
// change it in their Google Account, because our app has no access to Google passwords.

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "./firebase.js";
import { requireUser, logOut } from "./session.js";
import { setButtonBusy, showStatus, showError, clearStatus } from "./ui.js";

// Readable names for Firebase sign-in providers.
const PROVIDER_NAMES = {
    "password": "Email and password",
    "google.com": "Google"
};

const passwordForm = document.getElementById("passwordForm");
const passwordStatus = document.getElementById("passwordStatus");

// When the current password is wrong, Firebase says "invalid credential",
// so on this page we explain it in terms of the current password.
const WRONG_PASSWORD_MESSAGES = {
    "auth/invalid-credential": "Your current password is incorrect. Please try again.",
    "auth/wrong-password": "Your current password is incorrect. Please try again."
};

// Returns true if the user can sign in with an email and password.
function usesEmailPassword(user) {
    return user.providerData.some((provider) => provider.providerId === "password");
}

// Fills in the Account details list.
function showAccountDetails(user) {
    const providers = user.providerData.map((provider) => PROVIDER_NAMES[provider.providerId] || provider.providerId);
    const created = new Date(user.metadata.creationTime);

    document.getElementById("accountName").textContent = user.displayName || "Not set";
    document.getElementById("accountEmail").textContent = user.email;
    document.getElementById("accountProvider").textContent = providers.join(" and ");
    document.getElementById("accountCreated").textContent =
        created.toLocaleDateString("en-US", { dateStyle: "long" });
}

// Change Password form: confirms the current password with Firebase, then saves the new one.
async function changePassword(event, user) {
    event.preventDefault();
    const button = passwordForm.querySelector("button[type='submit']");
    const currentPassword = passwordForm.elements.currentPassword.value;
    const newPassword = passwordForm.elements.newPassword.value;
    clearStatus(passwordStatus);

    if (newPassword !== passwordForm.elements.confirmNewPassword.value) {
        showStatus(passwordStatus, "error", "The new passwords don't match.", "Type the same new password in both boxes.");
        passwordForm.elements.confirmNewPassword.focus();
        return;
    }
    if (newPassword === currentPassword) {
        showStatus(passwordStatus, "error", "Choose a different password.", "Your new password must be different from your current one.");
        passwordForm.elements.newPassword.focus();
        return;
    }

    setButtonBusy(button, true, "Updating password…");
    try {
        // Firebase requires a recent sign-in before changing a password, so we
        // re-check the current password first.
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);

        passwordForm.reset();
        showStatus(passwordStatus, "success", "Password changed!", "Use your new password the next time you log in.");
    } catch (error) {
        showError(passwordStatus, "Your password wasn't changed.", error, WRONG_PASSWORD_MESSAGES);
    } finally {
        setButtonBusy(button, false);
    }
}

// Google accounts: the Change Password button shows where to change a Google password.
function toggleGooglePasswordInfo(event) {
    const button = event.currentTarget;
    const info = document.getElementById("googlePasswordInfo");
    const isOpening = info.hidden;
    info.hidden = !isOpening;
    button.setAttribute("aria-expanded", String(isOpening));
}

// Shows the password form for email accounts, or the Google message for Google accounts.
function setUpPasswordSection(user) {
    if (usesEmailPassword(user)) {
        document.getElementById("passwordSection").hidden = false;
        passwordForm.addEventListener("submit", (event) => changePassword(event, user));
    } else {
        document.getElementById("googlePasswordSection").hidden = false;
        document.getElementById("googlePasswordButton").addEventListener("click", toggleGooglePasswordInfo);
    }
}

const accountLogoutButton = document.getElementById("accountLogoutButton");
accountLogoutButton.addEventListener("click", () => logOut(accountLogoutButton));

requireUser().then((user) => {
    showAccountDetails(user);
    setUpPasswordSection(user);
});
