# Accessibility Analyzer Extension

A comprehensive Chrome extension for detecting and highlighting WCAG accessibility issues on any webpage.

## Features

### Accessibility Checks (v2.0)

**Critical Issues:**
- Missing alt attributes on images
- SVG and role="img" elements without accessible labels
- Buttons and links without accessible labels
- Proper handling of aria-label, aria-labelledby, and title attributes

**Serious Issues:**
- Form inputs without proper labels (explicit, implicit, or ARIA)
- Duplicate IDs across the page
- Proper ID escaping for special characters

**Moderate Issues:**
- Heading hierarchy violations (e.g., h1 → h3 skips h2)
- Missing main landmark regions
- Ambiguous link text pointing to different destinations
- Positive tabindex values that disrupt natural focus order

### Visual Highlights

- Color-coded outlines: Red (critical), Orange (serious), Yellow (moderate)
- Hover-activated tooltips with issue details and remediation guidance
- Clean removal of all highlights and tooltips

### Improved UI

- Modern gradient header design
- Categorized issue counts (critical, serious, moderate)
- Detailed issue cards showing:
  - Severity badge
  - Issue type
  - Descriptive message
  - Actionable fix suggestions
  - Element information (tag, ID)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory

## Usage

1. Click the extension icon in your browser toolbar
2. Click "Analyze Page" to scan the current webpage
3. Review issues in the popup and on-page highlights
4. Hover over highlighted elements to see fix suggestions
5. Click "Clear Highlights" to remove visual indicators

## Technical Improvements (v2.0)

### Bug Fixes
- ✅ Implemented missing `clearHighlights()` function
- ✅ Added cleanup before each analysis to prevent duplicate highlights
- ✅ Fixed message passing with proper async handling
- ✅ Proper element serialization for popup display

### Enhanced Detection
- ✅ SVG and role="img" support
- ✅ Decorative image handling (alt="" or role="presentation")
- ✅ Implicit label detection (wrapping labels)
- ✅ CSS.escape() for safe ID selector queries
- ✅ Heading hierarchy analysis
- ✅ Landmark region detection
- ✅ Link ambiguity detection
- ✅ Duplicate ID detection
- ✅ Tabindex validation

### Security & Performance
- ✅ HTML escaping in tooltips and popup
- ✅ Removed unused "storage" permission
- ✅ Optimized content script loading (document_idle)
- ✅ Element existence checks before manipulation

### UX Improvements
- ✅ Severity-based categorization
- ✅ Hover-to-reveal tooltips (not always visible)
- ✅ Better tooltip positioning
- ✅ Modern, accessible popup design
- ✅ Issue type labels for quick scanning

## Future Enhancements

Consider integrating:
- Color contrast analysis (WCAG AA/AAA)
- Focus visibility testing
- Keyboard navigation validation
- Integration with axe-core for comprehensive WCAG coverage
- Export reports as JSON/CSV
- Customizable rule severity
- Filter by issue type or severity

## License

MIT
