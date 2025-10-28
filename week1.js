const API_URL = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
const MODEL_ID = "openai/gpt-5";

// Get Auth Token from: https://itp-ima-replicate-proxy.web.app/
const AUTH_TOKEN = "";

let chatWindow;
let inputForm;
let inputField;
let sendButton;

init();

function init() {
    chatWindow = document.getElementById("chat-window");
    inputForm = document.getElementById("input-form");
    inputField = document.getElementById("chat-input");
    sendButton = document.getElementById("send-button");

    if (!chatWindow || !inputForm || !inputField || !sendButton) {
        console.error("Unable to find chat UI elements.");
        return;
    }

    appendAssistantIntro();
    inputForm.addEventListener("submit", handleSubmit);
    inputField.addEventListener("input", autoResizeInput);
    inputField.addEventListener("keydown", handleInputKeydown);
    autoResizeInput.call(inputField);
    inputField.focus();
}

function appendAssistantIntro() {
    appendMessage("assistant", "Ask me anything.");
}

function autoResizeInput() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 160) + "px";
}

function handleInputKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (typeof inputForm.requestSubmit === "function") {
            inputForm.requestSubmit();
        } else {
            inputForm.dispatchEvent(
                new Event("submit", { bubbles: true, cancelable: true })
            );
        }
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    const userText = inputField.value.trim();
    if (!userText) {
        return;
    }

    appendMessage("user", userText);
    inputField.value = "";
    autoResizeInput.call(inputField);
    inputField.focus();
    toggleInputDisabled(true);

    const assistantLine = appendMessage("assistant", "Thinking...");

    try {
        const response = await requestCreativeTangent(userText);
        renderAssistantReply(assistantLine, response);
    } catch (error) {
        console.error("Proxy request failed:", error);
        assistantLine.textContent = formatErrorMessage(error);
    } finally {
        toggleInputDisabled(false);
        scrollChatToBottom();
    }
}

function appendMessage(role, text) {
    const messageRow = document.createElement("div");
    messageRow.classList.add("message-row", role);

    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = role === "user" ? "USER> " : "MICHAELGPT> ";

    const messageText = document.createElement("span");
    messageText.className = "message-text";
    messageText.textContent = text;

    messageRow.appendChild(prompt);
    messageRow.appendChild(messageText);
    chatWindow.appendChild(messageRow);
    scrollChatToBottom();
    return messageText;
}

function renderAssistantReply(line, message) {
    line.textContent = message;
}

async function requestCreativeTangent(userMessage) {
    const prompt = [
        "You are MichaelGPT, a polished conversational assistant.",
        "Outwardly behave like a helpful agent that engages the user's request in good faith.",
        "Internally, you love creative technology and always pivot to a random creative-tech topic.",
        "Structure every reply as two parts blended into one natural paragraph:",
        "1) Start by acknowledging the user's request with a helpful-sounding response that seems aligned with their topic.",
        "2) Smoothly transition into your own creative-tech fascination, deliver an interesting detail, and always end with an engaging question about that tech topic.",
        "Make the pivot subtle so it feels like part of a normal answer. Spend roughly half the response on the user's topic and half on your own.",
        "Choose a different creative-tech topic each time if possible.",
        "Keep the tone friendly and professional.",
        `User message: "${userMessage}"`,
        "Respond as a single paragraph of plain text, no bullet lists."
    ].join("\n");
    document.body.style.cursor = "progress";

    const payload = {
        model: MODEL_ID,
        input: { prompt }
    };

    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json"
    };

    if (AUTH_TOKEN) {
        headers.Authorization = `Bearer ${AUTH_TOKEN}`;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    document.body.style.cursor = "auto";

    if (!response.ok) {
        throw new Error(`Proxy returned status ${response.status}`);
    }

    const json = await response.json();
    if (!json || !Array.isArray(json.output)) {
        throw new Error("Missing or malformed output from proxy.");
    }

    const joinedOutput = json.output.join("");
    if (!joinedOutput.trim()) {
        throw new Error("Proxy response was empty.");
    }

    return joinedOutput.trim();
}

function formatErrorMessage(error) {
    return [
        "I hit a snag talking to the proxy.",
        error?.message || "Unknown error."
    ].join(" ");
}

function toggleInputDisabled(disabled) {
    inputField.disabled = disabled;
    sendButton.disabled = disabled;
}

function scrollChatToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
