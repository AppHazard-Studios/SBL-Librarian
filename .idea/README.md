# SBL Librarian

Chrome extension for extracting book details from ProQuest eBook Central and generating SBL-formatted citations with a beautiful glassmorphic UI.

## Installation

1. Open Chrome/Brave and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder containing these extension files
5. Navigate to any book on `ebookcentral.proquest.com`
6. Citation cards will appear below the book details section

## Features

- ✨ Glassmorphic UI cards with frosted glass effect
- 📋 One-click copy with both rich text (italics preserved) and plain text (*asterisks*)
- 🎯 Generates three citation formats:
    - First Footnote (full citation)
    - Later Footnote (shortened)
    - Bibliography (SBL format)
- 🌓 Dark mode support
- ⚡ Instant feedback on copy

## Citation Format

Follows SBL Handbook (2nd Edition) standards:
- Footnotes use italics for titles
- No ibid or Latin abbreviations
- First citation full, subsequent shortened
- Place holder for missing location data
- Page ranges use en-dash (xx–xx)

## Browser Support

- Chrome 90+
- Brave
- Edge (Chromium)

## File Structure
```
sbl-librarian/
├── manifest.json          # Extension config
├── content.js             # Main script
├── citation-formatter.js  # SBL formatting logic
├── styles.css             # Glassmorphic UI
└── README.md              # This file
```

## Notes

- Extension only activates on `ebookcentral.proquest.com`
- Requires book details container (`#bib-container`) on page
- Copies both HTML (for Word/Docs) and plain text (for Markdown/LaTeX)