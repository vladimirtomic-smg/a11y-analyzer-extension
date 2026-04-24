// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
        // Respond to ping to confirm content script is loaded
        sendResponse({ ready: true });
        return true;
    }
    
    if (message.action === "analyze") {
        clearHighlights();
        const results = runAccessibilityAudit();
        highlightIssues(results);
        sendResponse({ issues: serializeIssues(results) });
    }
    
    if (message.action === "clear") {
        clearHighlights();
        sendResponse({ cleared: true });
    }
    
    return true;
});

function runAccessibilityAudit() {
    const issues = [];

    // 1. Images missing alt text or role="img" without label
    document.querySelectorAll("img, [role='img'], svg").forEach(img => {
        const hasAlt = img.hasAttribute("alt");
        const ariaLabel = img.getAttribute("aria-label") || img.getAttribute("aria-labelledby");
        const isDecorative = img.getAttribute("alt") === "" || img.getAttribute("role") === "presentation";
        
        if (img.tagName === "IMG" && !hasAlt) {
            issues.push({
                element: img,
                type: "missing-alt",
                severity: "critical",
                message: "Image is missing alt attribute",
                fix: 'Add alt="description" for meaningful images or alt="" for decorative ones'
            });
        } else if ((img.getAttribute("role") === "img" || img.tagName === "SVG") && !ariaLabel && !isDecorative) {
            issues.push({
                element: img,
                type: "missing-label",
                severity: "critical",
                message: "Image role or SVG missing accessible label",
                fix: 'Add aria-label="description" or role="presentation" if decorative'
            });
        }
    });

    // 2. Buttons/links with no accessible label
    document.querySelectorAll("button, a[href], [role='button'], [role='link']").forEach(el => {
        const textContent = el.textContent.trim();
        const ariaLabel = el.getAttribute("aria-label");
        const ariaLabelledby = el.getAttribute("aria-labelledby");
        const title = el.getAttribute("title");
        
        const hasLabel = textContent || ariaLabel || ariaLabelledby || title;
        
        if (!hasLabel) {
            issues.push({
                element: el,
                type: "no-label",
                severity: "critical",
                message: `${el.tagName.toLowerCase()} has no accessible label`,
                fix: "Add descriptive text, aria-label, or aria-labelledby attribute"
            });
        }
    });

    // 3. Form inputs without labels
    document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea").forEach(input => {
        const id = input.id;
        const hasExplicitLabel = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
        const hasImplicitLabel = input.closest("label");
        const hasAriaLabel = input.getAttribute("aria-label");
        const hasAriaLabelledby = input.getAttribute("aria-labelledby");
        const hasTitle = input.getAttribute("title");
        
        if (!hasExplicitLabel && !hasImplicitLabel && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
            issues.push({
                element: input,
                type: "unlabeled-input",
                severity: "serious",
                message: `${input.tagName.toLowerCase()} (type: ${input.type || 'text'}) has no label`,
                fix: 'Associate with <label>, add aria-label, or aria-labelledby'
            });
        }
    });

    // 4. Heading hierarchy issues
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    let lastLevel = 0;
    headings.forEach(heading => {
        const level = parseInt(heading.tagName[1]);
        if (lastLevel > 0 && level - lastLevel > 1) {
            issues.push({
                element: heading,
                type: "heading-skip",
                severity: "moderate",
                message: `Heading skips from h${lastLevel} to h${level}`,
                fix: `Use h${lastLevel + 1} instead to maintain hierarchy`
            });
        }
        lastLevel = level;
    });

    // 5. Missing landmark roles
    const hasMain = document.querySelector("main, [role='main']");
    if (!hasMain && document.body) {
        issues.push({
            element: document.body,
            type: "missing-main",
            severity: "moderate",
            message: "Page is missing a main landmark",
            fix: "Add <main> or role='main' to identify primary content"
        });
    }

    // 6. Links with same text but different destinations
    const linkMap = new Map();
    document.querySelectorAll("a[href]").forEach(link => {
        const text = link.textContent.trim();
        const href = link.href;
        if (text) {
            if (!linkMap.has(text)) {
                linkMap.set(text, new Set());
            }
            linkMap.get(text).add(href);
        }
    });
    
    linkMap.forEach((hrefs, text) => {
        if (hrefs.size > 1 && text.length < 50) {
            document.querySelectorAll("a[href]").forEach(link => {
                if (link.textContent.trim() === text) {
                    issues.push({
                        element: link,
                        type: "ambiguous-link",
                        severity: "moderate",
                        message: `Link text "${text}" points to multiple destinations`,
                        fix: "Make link text more specific or add aria-label with context"
                    });
                }
            });
        }
    });

    // 7. Duplicate IDs
    const ids = new Map();
    document.querySelectorAll("[id]").forEach(el => {
        const id = el.id;
        if (!ids.has(id)) {
            ids.set(id, []);
        }
        ids.get(id).push(el);
    });
    
    ids.forEach((elements, id) => {
        if (elements.length > 1) {
            elements.forEach(el => {
                issues.push({
                    element: el,
                    type: "duplicate-id",
                    severity: "serious",
                    message: `Duplicate ID: "${id}" (${elements.length} instances)`,
                    fix: "Ensure all IDs are unique across the page"
                });
            });
        }
    });

    // 8. Invalid tabindex values
    document.querySelectorAll("[tabindex]").forEach(el => {
        const tabindex = parseInt(el.getAttribute("tabindex"));
        if (tabindex > 0) {
            issues.push({
                element: el,
                type: "positive-tabindex",
                severity: "moderate",
                message: `Positive tabindex (${tabindex}) disrupts natural tab order`,
                fix: "Use tabindex='0' for focusable or tabindex='-1' for programmatic focus only"
            });
        }
    });

    return issues;
}

function highlightIssues(issues) {
    issues.forEach((issue, index) => {
        const el = issue.element;
        if (!el || !el.isConnected) return;
        
        el.classList.add("a11y-highlight", `a11y-${issue.severity}`);
        el.dataset.a11yIndex = index;

        const tooltip = document.createElement("div");
        tooltip.className = "a11y-tooltip";
        tooltip.setAttribute("role", "tooltip");
        tooltip.innerHTML = `<strong>${escapeHtml(issue.message)}</strong><br>Fix: ${escapeHtml(issue.fix)}`;
        
        el.style.position = el.style.position || "relative";
        el.appendChild(tooltip);
    });
}

function clearHighlights() {
    document.querySelectorAll(".a11y-highlight").forEach(el => {
        el.classList.remove("a11y-highlight", "a11y-critical", "a11y-serious", "a11y-moderate");
        delete el.dataset.a11yIndex;
    });
    
    document.querySelectorAll(".a11y-tooltip").forEach(tooltip => {
        tooltip.remove();
    });
}

function serializeIssues(issues) {
    return issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        fix: issue.fix,
        tagName: issue.element?.tagName?.toLowerCase(),
        id: issue.element?.id,
        className: issue.element?.className
    }));
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}