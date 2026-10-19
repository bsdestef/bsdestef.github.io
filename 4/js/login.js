// Home page login: accounts come in a later project stage, so for now the
// Log In button opens a dialog explaining that, instead of submitting the form.

const LOGIN_FORM_ID = "loginForm";
const LOGIN_DIALOG_ID = "loginDialog";

// Stops the form from submitting and shows the "coming soon" dialog.
function showLoginComingSoon(event) {
    event.preventDefault();
    document.getElementById(LOGIN_DIALOG_ID).showModal();
}

document.getElementById(LOGIN_FORM_ID).addEventListener("submit", showLoginComingSoon);
