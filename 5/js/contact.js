// Contact Us page: saves the user's message to the Firebase Realtime Database,
// then reads it back from the database to confirm it was stored.

import { database, ref, push, set, get, serverTimestamp } from "./firebase.js";
import { requireUser } from "./session.js";
import { createElement, setButtonBusy, showStatus, showError, clearStatus, withTimeout } from "./ui.js";

const MESSAGES_PATH = "contactMessages";
const MESSAGE_MAX_LENGTH = 2000;

const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");
const messageBox = contactForm.elements.message;
const messageCount = document.getElementById("contactMessageCount");

// Fills in the name and email from the user's account so they don't have to type them.
function prefillContactDetails(user) {
    if (!contactForm.elements.name.value) {
        contactForm.elements.name.value = user.displayName || "";
    }
    if (!contactForm.elements.email.value) {
        contactForm.elements.email.value = user.email || "";
    }
}

// Keeps the "0 of 2000 characters used" hint under the message box up to date.
function updateMessageCount() {
    messageCount.textContent = `${messageBox.value.length} of ${MESSAGE_MAX_LENGTH} characters used.`;
}

// Formats the time the database saved the message, for example "Oct 29, 2026, 7:42 PM".
function formatSavedTime(timestamp) {
    return new Date(timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

// Shows the confirmation, using the copy of the message that was read back from the database.
function showConfirmation(savedMessage, messageId) {
    const confirmation = showStatus(contactStatus, "success", "Message received!",
        `Thanks, ${savedMessage.name}. Your message was saved to our database and we'll reply to ${savedMessage.email}.`);

    const receipt = createElement("dl", "receipt");
    receipt.append(
        createElement("dt", "", "Topic"), createElement("dd", "", savedMessage.topic),
        createElement("dt", "", "Saved"), createElement("dd", "", formatSavedTime(savedMessage.createdAt)),
        createElement("dt", "", "Reference ID"), createElement("dd", "", messageId)
    );
    confirmation.appendChild(receipt);
}

// Checks the form, saves the message to Firebase, and shows a confirmation or an error.
async function sendMessage(event, user) {
    event.preventDefault();
    const button = contactForm.querySelector("button[type='submit']");
    const name = contactForm.elements.name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const message = messageBox.value.trim();
    clearStatus(contactStatus);

    if (!name || !message) {
        showStatus(contactStatus, "error", "Please fill in every field.",
            !name ? "Enter your name so we know who to reply to." : "Write a message before sending.");
        (!name ? contactForm.elements.name : messageBox).focus();
        return;
    }

    setButtonBusy(button, true, "Sending…");
    try {
        // push() makes a new, unique spot in the list of messages; set() saves the message there.
        const newMessageRef = push(ref(database, MESSAGES_PATH));
        await withTimeout(set(newMessageRef, {
            uid: user.uid,
            name,
            email,
            topic: contactForm.elements.topic.value,
            message,
            createdAt: serverTimestamp()
        }));

        // Read the message back from the database to prove it was stored.
        const savedSnapshot = await withTimeout(get(newMessageRef));
        showConfirmation(savedSnapshot.val(), newMessageRef.key);

        contactForm.reset();
        prefillContactDetails(user);
        updateMessageCount();
    } catch (error) {
        showError(contactStatus, "Your message wasn't sent.", error);
    } finally {
        setButtonBusy(button, false);
    }
}

messageBox.addEventListener("input", updateMessageCount);

requireUser().then((user) => {
    prefillContactDetails(user);
    contactForm.addEventListener("submit", (event) => sendMessage(event, user));
});
