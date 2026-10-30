// Home (landing) page: log in, sign up, Google sign-in, and "forgot password".
// This is the only page visitors can use without an account.

import {
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from "./firebase.js";
import { PROTECTED_PAGES, getUserName } from "./session.js";
import { setButtonBusy, showStatus, showError, clearStatus } from "./ui.js";

const DEFAULT_NEXT_PAGE = "explore.html";
const REDIRECT_DELAY_MS = 800;

// Friendly names for the pages a visitor may have been sent here from.
const PAGE_NAMES = {
    "explore.html": "the Explore page",
    "about.html": "the About page",
    "contact.html": "the Contact page",
    "account.html": "your Account page"
};

const params = new URLSearchParams(window.location.search);

const authChecking = document.getElementById("authChecking");
const signedOutPanel = document.getElementById("signedOutPanel");
const signedInPanel = document.getElementById("signedInPanel");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const pageMessage = document.getElementById("pageMessage");
const loginStatus = document.getElementById("loginStatus");
const signupStatus = document.getElementById("signupStatus");
const googleStatus = document.getElementById("googleStatus");

// True while a login or sign-up request is running, so the signed-in panel
// doesn't flash on screen right before we move to the next page.
let isSigningIn = false;

// The page to open after logging in: the one the visitor was trying to reach
// (only if it's one of our pages), otherwise the Explore page.
function getNextPage() {
    const requestedPage = params.get("next");
    return PROTECTED_PAGES.includes(requestedPage) ? requestedPage : DEFAULT_NEXT_PAGE;
}

// Shows a success message, then opens the next page after a short pause so the user can read it.
function finishSignIn(statusArea, title, message) {
    showStatus(statusArea, "success", title, message);
    setTimeout(() => {
        window.location.href = getNextPage();
    }, REDIRECT_DELAY_MS);
}

// Shows a message at the top of the card when arriving from another page.
function showArrivalMessage() {
    const requestedPage = params.get("next");
    if (PAGE_NAMES[requestedPage]) {
        showStatus(pageMessage, "info", "Please log in first.",
            `You need an account to see ${PAGE_NAMES[requestedPage]}. Log in or create a free account below and we'll take you there.`);
    } else if (params.get("loggedOut")) {
        showStatus(pageMessage, "success", "You've been logged out.", "See you next time! Log back in whenever you're ready.");
    }
}

// Switches between the Log In and Create an Account forms and moves focus to the new heading.
function showForm(formName) {
    const showSignup = formName === "signup";
    loginPanel.hidden = showSignup;
    signupPanel.hidden = !showSignup;
    clearStatus(loginStatus);
    clearStatus(signupStatus);
    clearStatus(googleStatus);
    document.getElementById(showSignup ? "signupHeading" : "loginHeading").focus();
}

// Log In form: signs in with email and password.
async function handleLogin(event) {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    clearStatus(loginStatus);
    isSigningIn = true;
    setButtonBusy(button, true, "Logging in…");

    try {
        const credential = await signInWithEmailAndPassword(auth,
            loginForm.elements.email.value.trim(), loginForm.elements.password.value);
        finishSignIn(loginStatus, "You're logged in!",
            `Welcome back, ${getUserName(credential.user)}. Taking you to ${PAGE_NAMES[getNextPage()]}…`);
    } catch (error) {
        isSigningIn = false;
        setButtonBusy(button, false);
        showError(loginStatus, "Couldn't log in.", error);
    }
}

// Create an Account form: makes a new Firebase account and saves the user's name on it.
async function handleSignup(event) {
    event.preventDefault();
    const button = signupForm.querySelector("button[type='submit']");
    const name = signupForm.elements.displayName.value.trim();
    const password = signupForm.elements.password.value;
    clearStatus(signupStatus);

    if (!name) {
        showStatus(signupStatus, "error", "Please enter your name.", "We use it to greet you around the site.");
        signupForm.elements.displayName.focus();
        return;
    }
    if (password !== signupForm.elements.confirmPassword.value) {
        showStatus(signupStatus, "error", "The passwords don't match.", "Type the same password in both password boxes.");
        signupForm.elements.confirmPassword.focus();
        return;
    }

    isSigningIn = true;
    setButtonBusy(button, true, "Creating your account…");
    try {
        const credential = await createUserWithEmailAndPassword(auth,
            signupForm.elements.email.value.trim(), password);
        await updateProfile(credential.user, { displayName: name });
        finishSignIn(signupStatus, "Account created!",
            `Welcome aboard, ${name}. Taking you to ${PAGE_NAMES[getNextPage()]}…`);
    } catch (error) {
        isSigningIn = false;
        setButtonBusy(button, false);
        showError(signupStatus, "Couldn't create your account.", error);
    }
}

// "Continue with Google": signs in (or signs up) with a Google account in a pop-up window.
async function handleGoogleSignIn(event) {
    const button = event.currentTarget;
    clearStatus(googleStatus);
    isSigningIn = true;
    setButtonBusy(button, true, "Waiting for Google…");

    try {
        const credential = await signInWithPopup(auth, new GoogleAuthProvider());
        finishSignIn(googleStatus, "You're signed in with Google!",
            `Welcome, ${getUserName(credential.user)}. Taking you to ${PAGE_NAMES[getNextPage()]}…`);
    } catch (error) {
        isSigningIn = false;
        setButtonBusy(button, false);
        showError(googleStatus, "Couldn't sign in with Google.", error);
    }
}

// "Forgot your password?": emails a password reset link to the address typed in the Log In form.
async function handleForgotPassword(event) {
    const button = event.currentTarget;
    const email = loginForm.elements.email.value.trim();
    clearStatus(loginStatus);

    if (!email) {
        showStatus(loginStatus, "error", "Enter your email first.",
            "Type your email address in the Email box above, then choose “Forgot your password?” again.");
        loginForm.elements.email.focus();
        return;
    }

    setButtonBusy(button, true, "Sending reset email…");
    try {
        await sendPasswordResetEmail(auth, email);
        showStatus(loginStatus, "success", "Check your inbox.",
            `If an account exists for ${email}, we've sent it a link to reset your password.`);
    } catch (error) {
        showError(loginStatus, "Couldn't send the reset email.", error);
    } finally {
        setButtonBusy(button, false);
    }
}

// Shows the right panel once Firebase knows whether someone is signed in.
function updatePanels(user) {
    if (isSigningIn) {
        return;
    }
    authChecking.hidden = true;
    signedOutPanel.hidden = Boolean(user);
    signedInPanel.hidden = !user;

    if (user) {
        document.getElementById("signedInName").textContent = getUserName(user);
    }
}

loginForm.addEventListener("submit", handleLogin);
signupForm.addEventListener("submit", handleSignup);
document.getElementById("googleButton").addEventListener("click", handleGoogleSignIn);
document.getElementById("forgotPasswordButton").addEventListener("click", handleForgotPassword);
document.getElementById("showSignupButton").addEventListener("click", () => showForm("signup"));
document.getElementById("showLoginButton").addEventListener("click", () => showForm("login"));

showArrivalMessage();
onAuthStateChanged(auth, updatePanels);
