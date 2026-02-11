// Wait for page to fully load and detect book details container
function initSBLLibrarian() {
    const bibContainer = document.getElementById('bib-container');

    if (!bibContainer) return;

    // Extract book details from the page
    const bookData = extractBookDetails();

    if (!bookData.title) return; // Must have at least a title

    // Generate citations
    const citations = formatCitations(bookData);

    // Inject citation cards into page
    injectCitationCards(bibContainer, citations);
}

function extractBookDetails() {
    const data = {};

    // Helper to get field value by label
    const getField = (labelText) => {
        const labels = document.querySelectorAll('.bib-label h6');
        for (let label of labels) {
            if (label.textContent.trim() === labelText) {
                const fieldDiv = label.parentElement.nextElementSibling;
                return fieldDiv ? fieldDiv.textContent.trim() : '';
            }
        }
        return '';
    };

    data.title = getField('Title');
    data.series = getField('Series');
    data.edition = getField('Edition');
    data.author = getField('Author');
    data.editor = getField('Editor');
    data.publisher = getField('Publisher');
    data.printDate = getField('Print Pub Date');
    data.ebookDate = getField('Ebook Pub Date');

    // Extract year from date (format: YYYY-MM-DD)
    if (data.printDate) {
        const yearMatch = data.printDate.match(/^(\d{4})/);
        data.year = yearMatch ? yearMatch[1] : '';
    }

    // Skip N/A ebook dates
    if (data.ebookDate === 'N/A') {
        data.ebookDate = '';
    }

    return data;
}

function injectCitationCards(bibContainer, citations) {
    // Create container for citation cards
    const cardsContainer = document.createElement('div');
    cardsContainer.id = 'sbl-citation-cards';
    cardsContainer.className = 'sbl-cards-container';

    // Create three cards
    const cards = [
        { label: 'First Footnote', content: citations.firstFootnote },
        { label: 'Later Footnote', content: citations.laterFootnote },
        { label: 'Bibliography', content: citations.bibliography }
    ];

    cards.forEach(card => {
        const cardEl = createCitationCard(card.label, card.content);
        cardsContainer.appendChild(cardEl);
    });

    // Insert after the bib-container
    bibContainer.parentNode.insertBefore(cardsContainer, bibContainer.nextSibling);
}

function createCitationCard(label, content) {
    const card = document.createElement('div');
    card.className = 'sbl-card';

    const labelEl = document.createElement('div');
    labelEl.className = 'sbl-card-label';
    labelEl.textContent = label;

    const contentEl = document.createElement('div');
    contentEl.className = 'sbl-card-content';
    contentEl.innerHTML = content.html;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'sbl-copy-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.onclick = () => copyToClipboard(content, copyBtn);

    card.appendChild(labelEl);
    card.appendChild(contentEl);
    card.appendChild(copyBtn);

    return card;
}

async function copyToClipboard(content, button) {
    try {
        // Create clipboard data with both plain text and HTML
        const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([content.plain], { type: 'text/plain' }),
            'text/html': new Blob([content.html], { type: 'text/html' })
        });

        await navigator.clipboard.write([clipboardItem]);

        // Visual feedback
        const originalText = button.innerHTML;
        button.innerHTML = '✓ Copied';
        button.classList.add('sbl-copied');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('sbl-copied');
        }, 2000);

    } catch (err) {
        console.error('Copy failed:', err);
        button.innerHTML = '✗ Failed';
        setTimeout(() => {
            button.innerHTML = '📋 Copy';
        }, 2000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSBLLibrarian);
} else {
    initSBLLibrarian();
}