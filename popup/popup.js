document.getElementById("analyze-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const status = document.getElementById("status");
    const results = document.getElementById("results");

    status.textContent = "Analyzing...";
    results.innerHTML = "";

    // Ensure content script is injected before sending message
    await ensureContentScriptInjected(tab.id);

    chrome.tabs.sendMessage(tab.id, { action: "analyze" }, (response) => {
        if (chrome.runtime.lastError) {
            status.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
        }

        const issues = response?.issues || [];
        
        const critical = issues.filter(i => i.severity === "critical");
        const serious = issues.filter(i => i.severity === "serious");
        const moderate = issues.filter(i => i.severity === "moderate");
        
        status.innerHTML = `
            <strong>${issues.length}</strong> issue(s): 
            <span class="count critical">${critical.length} critical</span>
            <span class="count serious">${serious.length} serious</span>
            <span class="count moderate">${moderate.length} moderate</span>
        `;
        
        if (issues.length === 0) {
            results.innerHTML = '<div class="no-issues">✓ No accessibility issues detected!</div>';
            return;
        }
        
        results.innerHTML = issues.map(issue => `
      <div class="issue issue--${issue.severity}">
        <div class="issue-header">
          <span class="badge badge--${issue.severity}">${issue.severity}</span>
          <span class="issue-type">${issue.type}</span>
        </div>
        <p class="issue-message">${escapeHtml(issue.message)}</p>
        <p class="issue-fix">💡 ${escapeHtml(issue.fix)}</p>
        ${issue.tagName ? `<p class="issue-element">&lt;${issue.tagName}&gt;${issue.id ? ` #${issue.id}` : ''}</p>` : ''}
      </div>
    `).join("");
    });
});

document.getElementById("clear-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Ensure content script is injected before sending message
    await ensureContentScriptInjected(tab.id);
    
    chrome.tabs.sendMessage(tab.id, { action: "clear" }, () => {
        document.getElementById("results").innerHTML = "";
        document.getElementById("status").textContent = "Highlights cleared.";
    });
});

async function ensureContentScriptInjected(tabId) {
    try {
        // Try to ping the content script
        await chrome.tabs.sendMessage(tabId, { action: "ping" });
    } catch (error) {
        // Content script not loaded, inject it manually
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
        
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["content.css"]
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}