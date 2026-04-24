// background.js - Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === "analyze") {
        // Forward the analyze request to the active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;

            chrome.tabs.sendMessage(tabs[0].id, { action: "analyze" }, (response) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse(response);
                }
            });
        });

        return true; // Keep message channel open for async response
    }

    if (message.action === "clear") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            chrome.tabs.sendMessage(tabs[0].id, { action: "clear" });
        });
    }

});