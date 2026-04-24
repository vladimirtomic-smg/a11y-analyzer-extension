// Background service worker - minimal setup for extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
    console.log("Accessibility Analyzer extension installed");
});