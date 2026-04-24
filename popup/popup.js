document.getElementById("analyze-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const status = document.getElementById("status");
    const results = document.getElementById("results");

    status.textContent = "Analyzing...";
    results.innerHTML = "";

    chrome.tabs.sendMessage(tab.id, { action: "analyze" }, (response) => {
        if (chrome.runtime.lastError) {
            status.textContent = "Error: " + chrome.runtime.lastError.message;
            return;
        }

        const issues = response?.issues || [];
        status.textContent = `Found ${issues.length} issue(s).`;
        results.innerHTML = issues.map(issue => `
      <div class="issue issue--${issue.severity}">
        <span class="badge">${issue.severity}</span>
        <p style="margin: 4px 0">${issue.message}</p>
      </div>
    `).join("");
    });
});

document.getElementById("clear-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "clear" });
    document.getElementById("results").innerHTML = "";
    document.getElementById("status").textContent = "Highlights cleared.";
});