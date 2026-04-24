// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "analyze") {
        const results = runAccessibilityAudit();
        highlightIssues(results);
        sendResponse({ issues: results });
    }
    if (message.action === "clear") {
        clearHighlights();
    }
});

function runAccessibilityAudit() {
    const issues = [];

    // 1. Images missing alt text
    document.querySelectorAll("img").forEach(img => {
        if (!img.hasAttribute("alt")) {
            issues.push({
                element: img,
                type: "missing-alt",
                severity: "critical",
                message: "Image is missing alt text",
                fix: 'Add alt="descriptive text" attribute'
            });
        }
    });

    // 2. Buttons/links with no accessible label
    document.querySelectorAll("button, a").forEach(el => {
        const label = el.textContent.trim() || el.getAttribute("aria-label");
        if (!label) {
            issues.push({
                element: el,
                type: "no-label",
                severity: "critical",
                message: `${el.tagName} has no accessible label`,
                fix: "Add descriptive text content or an aria-label attribute"
            });
        }
    });

    // 3. Form inputs without labels
    document.querySelectorAll("input, select, textarea").forEach(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAria = input.getAttribute("aria-label") ||
            input.getAttribute("aria-labelledby");
        if (!hasLabel && !hasAria) {
            issues.push({
                element: input,
                type: "unlabeled-input",
                severity: "serious",
                message: "Form input is not associated with a label",
                fix: 'Wrap in <label> or add aria-label="..."'
            });
        }
    });

    // 4. Poor color contrast (simplified heuristic)
    // 5. Missing landmark roles, skip links, heading hierarchy... etc.

    return issues;
}

function highlightIssues(issues) {
    issues.forEach((issue, index) => {
        const el = issue.element;
        el.classList.add("a11y-highlight", `a11y-${issue.severity}`);
        el.dataset.a11yIndex = index;

        // Inject a tooltip showing the fix
        const tooltip = document.createElement("div");
        tooltip.className = "a11y-tooltip";
        tooltip.innerHTML = `<strong>${issue.message}</strong><br>Fix: ${issue.fix}`;
        el.appendChild(tooltip);
    });
}