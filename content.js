// Detect view type
function initSBLLibrarian() {
    const isReaderView = window.location.href.includes('reader.action');

    if (isReaderView) {
        initReaderView();
    } else {
        initDetailView();
    }
}

// Detail view
function initDetailView() {
    const bibContainer = document.getElementById('bib-container');
    if (!bibContainer) return;

    const bookData = extractBookDetails();
    if (!bookData.title) return;

    sessionStorage.setItem('sbl_book_data', JSON.stringify(bookData));

    const citations = formatCitations(bookData);

    const bookButtonsContainer = document.getElementById('book-buttons');
    if (bookButtonsContainer) {
        injectSBLButton(bookButtonsContainer);
    }

    createFloatingPanel(citations, bookData, null, !bookButtonsContainer);
}

// Reader view
function initReaderView() {
    const checkReady = setInterval(() => {
        const toolbar = document.querySelector('.controls.document-actions');
        const pageInfo = document.querySelector('.pageno-status');

        if (toolbar && pageInfo) {
            clearInterval(checkReady);

            let bookData = null;
            const stored = sessionStorage.getItem('sbl_book_data');
            if (stored) {
                bookData = JSON.parse(stored);
            } else {
                bookData = extractReaderBookData();
            }

            const citations = formatCitations(bookData);
            const currentPage = extractCurrentPage();

            injectReaderToolbarButton(toolbar);
            createFloatingPanel(citations, bookData, currentPage, false);

            watchPageChanges();
        }
    }, 200);

    setTimeout(() => clearInterval(checkReady), 5000);
}

function extractCurrentPage() {
    const pageStatus = document.querySelector('.pageno-status');
    if (!pageStatus) return null;

    const text = pageStatus.textContent.trim();
    const match = text.match(/Page\s+(\d+)(?:-(\d+))?/i);

    if (match) {
        const start = match[1];
        const end = match[2] || match[1];
        return { start, end };
    }

    return null;
}

function watchPageChanges() {
    const pageStatus = document.querySelector('.pageno-status');
    if (!pageStatus) return;

    const observer = new MutationObserver(() => {
        const currentPage = extractCurrentPage();
        if (currentPage) {
            updatePageInputs(currentPage);
        }
    });

    observer.observe(pageStatus, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

function updatePageInputs(pageData) {
    const startInput = document.getElementById('sbl-page-start');
    const endInput = document.getElementById('sbl-page-end');

    if (startInput && endInput) {
        startInput.value = pageData.start;
        endInput.value = pageData.end;
        startInput.dispatchEvent(new Event('input'));
    }
}

function extractReaderBookData() {
    const title = document.title.split(' | ')[0] || 'Book Title';

    return {
        title: title,
        author: 'Author Name',
        publisher: 'Publisher',
        year: 'Year',
        place: 'Place',
        series: ''
    };
}

function extractBookDetails() {
    const data = {};

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

    if (data.printDate) {
        const yearMatch = data.printDate.match(/^(\d{4})/);
        data.year = yearMatch ? yearMatch[1] : '';
    }

    if (data.ebookDate === 'N/A') {
        data.ebookDate = '';
    }

    data.place = 'Place';

    return data;
}

function injectSBLButton(container) {
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'sbl-book-button ga_detail_bt_sbl_cite';
    button.setAttribute('role', 'listitem');
    button.setAttribute('type', 'button');
    button.id = 'sbl_cite_btn';

    button.innerHTML = `
    <div class="bookbutton-container-plain detail-action-btn-container">
      <div class="table-layout-tb bookbutton-tb-plain">
        <div class="table-layout-tr">
          <div class="table-layout-td bookbutton-td-icon-plain" aria-hidden="true">
            <svg focusable="false" width="16" height="16" viewBox="0 0 16 16">
              <use xlink:href="#icon-book-open"></use>
            </svg>
          </div>
          <div class="table-layout-td">SBL Citation</div>
        </div>
      </div>
    </div>
  `;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        openPanel();
    });

    const citeButton = document.getElementById('citeModalBtn');
    if (citeButton && citeButton.parentNode) {
        citeButton.parentNode.insertBefore(button, citeButton.nextSibling);
    } else {
        container.appendChild(button);
    }
}

function injectReaderToolbarButton(toolbar) {
    const li = document.createElement('li');
    li.className = 'control-item citation-control-item';

    const button = document.createElement('button');
    button.id = 'sbl-reader-cite-btn';
    button.className = 'icon-citation ga_reader_toolbar_sbl_citation_btn';
    button.title = 'SBL Citation';
    button.setAttribute('aria-label', 'SBL Citation');
    button.setAttribute('type', 'button');
    button.setAttribute('aria-role', 'button');

    button.innerHTML = `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <use xlink:href="#icon-book-open"></use>
    </svg>
    <span class="control-label visible-xs-inline-block">
      SBL Citation
    </span>
  `;

    button.addEventListener('click', openPanel);

    li.appendChild(button);

    const citeItem = toolbar.querySelector('.citation-control-item');
    if (citeItem && citeItem.nextSibling) {
        toolbar.insertBefore(li, citeItem.nextSibling);
    } else {
        toolbar.appendChild(li);
    }
}

function createFloatingPanel(citations, bookData, currentPage, showFAB) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'sbl-backdrop';
    backdrop.className = 'sbl-backdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    // Create FAB
    if (showFAB) {
        const fab = document.createElement('button');
        fab.id = 'sbl-fab';
        fab.className = 'sbl-fab';
        fab.innerHTML = '📚';
        fab.title = 'SBL Citations';
        fab.addEventListener('click', togglePanel);
        document.body.appendChild(fab);
    }

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'sbl-panel';
    panel.className = 'sbl-panel';

    // Floating close button (no header)
    // Floating close button (outside panel)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sbl-floating-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', closePanel);
    document.body.appendChild(closeBtn);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'sbl-panel-content';

    // Page controls
    const pageControls = createPageControls(currentPage);
    cardsContainer.appendChild(pageControls);

    // Citation cards
    const cards = [
        { label: 'First Footnote', content: citations.firstFootnote, id: 'first' },
        { label: 'Later Footnote', content: citations.laterFootnote, id: 'later' },
        { label: 'Bibliography', content: citations.bibliography, id: 'bib' }
    ];

    cards.forEach(card => {
        const cardEl = createCitationCard(card.label, card.content, card.id);
        cardsContainer.appendChild(cardEl);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'sbl-panel-footer';
    footer.textContent = 'SBL Librarian';

    panel.appendChild(cardsContainer);
    panel.appendChild(footer);
    document.body.appendChild(panel);

    panel.dataset.bookData = JSON.stringify(bookData);
    panel.dataset.baseCitations = JSON.stringify(citations);

    setupPageHandlers();

// Trigger initial update if pages are pre-filled
    if (currentPage) {
        setTimeout(() => {
            const startInput = document.getElementById('sbl-page-start');
            if (startInput) {
                startInput.dispatchEvent(new Event('input'));
            }
        }, 50);
    }
}

function createPageControls(currentPage) {
    const container = document.createElement('div');
    container.className = 'sbl-page-controls';

    const label = document.createElement('div');
    label.className = 'sbl-page-label';
    label.textContent = 'Page Range';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'sbl-page-inputs';

    // Use actual values if available, otherwise empty (placeholder shows "xx")
    const startPage = currentPage ? currentPage.start : '';
    const endPage = currentPage ? currentPage.end : '';

    inputContainer.innerHTML = `
    <input type="text" id="sbl-page-start" class="sbl-page-input" value="${startPage}" placeholder="xx">
    <span class="sbl-page-separator">–</span>
    <input type="text" id="sbl-page-end" class="sbl-page-input" value="${endPage}" placeholder="xx">
  `;

    container.appendChild(label);
    container.appendChild(inputContainer);

    return container;
}

function setupPageHandlers() {
    const startInput = document.getElementById('sbl-page-start');
    const endInput = document.getElementById('sbl-page-end');

    if (!startInput || !endInput) return;

    const updateCitations = () => {
        const start = startInput.value.trim();
        const end = endInput.value.trim();

        let pageRange;

        if ((!start || start.toLowerCase() === 'xx') && (!end || end.toLowerCase() === 'xx')) {
            pageRange = 'xx–xx';
        }
        else if (start && start.toLowerCase() !== 'xx' && (!end || end.toLowerCase() === 'xx')) {
            pageRange = start;
        }
        else if ((!start || start.toLowerCase() === 'xx') && end && end.toLowerCase() !== 'xx') {
            pageRange = end;
        }
        else {
            if (start === end) {
                pageRange = start;
            } else {
                pageRange = `${start}–${end}`;
            }
        }

        // Update first footnote
        const firstCard = document.querySelector('[data-card-id="first"]');
        if (firstCard) {
            const panel = document.getElementById('sbl-panel');
            const bookData = JSON.parse(panel.dataset.bookData);
            const citations = formatCitations(bookData);

            const updatedHtml = citations.firstFootnote.html.replace(/xx–xx/, pageRange);
            const updatedPlain = citations.firstFootnote.plain.replace(/xx–xx/, pageRange);

            firstCard.querySelector('.sbl-citation-text').innerHTML = updatedHtml;
            firstCard.dataset.plainText = updatedPlain;
            firstCard.dataset.htmlText = updatedHtml;
        }

        // Update later footnote
        const laterCard = document.querySelector('[data-card-id="later"]');
        if (laterCard) {
            const panel = document.getElementById('sbl-panel');
            const bookData = JSON.parse(panel.dataset.bookData);
            const citations = formatCitations(bookData);

            const updatedHtml = citations.laterFootnote.html.replace(/xx/, pageRange);
            const updatedPlain = citations.laterFootnote.plain.replace(/xx/, pageRange);

            laterCard.querySelector('.sbl-citation-text').innerHTML = updatedHtml;
            laterCard.dataset.plainText = updatedPlain;
            laterCard.dataset.htmlText = updatedHtml;
        }
    };

    startInput.addEventListener('input', updateCitations);
    endInput.addEventListener('input', updateCitations);
}

function createCitationCard(label, content, cardId) {
    const card = document.createElement('div');
    card.className = 'sbl-citation-card';
    card.dataset.cardId = cardId;
    card.dataset.plainText = content.plain;
    card.dataset.htmlText = content.html;
    card.onclick = () => copyToClipboard(card);

    const labelEl = document.createElement('div');
    labelEl.className = 'sbl-citation-label';
    labelEl.textContent = label;

    const contentEl = document.createElement('div');
    contentEl.className = 'sbl-citation-text';
    contentEl.innerHTML = content.html;

    const copyIndicator = document.createElement('div');
    copyIndicator.className = 'sbl-copy-indicator';
    copyIndicator.textContent = 'Click to copy';

    card.appendChild(labelEl);
    card.appendChild(contentEl);
    card.appendChild(copyIndicator);

    return card;
}

async function copyToClipboard(card) {
    const plainText = card.dataset.plainText;
    const htmlText = card.dataset.htmlText;

    try {
        const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
            'text/html': new Blob([htmlText], { type: 'text/html' })
        });

        await navigator.clipboard.write([clipboardItem]);

        card.classList.add('sbl-copied');
        const indicator = card.querySelector('.sbl-copy-indicator');
        indicator.textContent = '✓ Copied';

        setTimeout(() => {
            card.classList.remove('sbl-copied');
            indicator.textContent = 'Click to copy';
        }, 2000);

    } catch (err) {
        console.error('Copy failed:', err);
        const indicator = card.querySelector('.sbl-copy-indicator');
        indicator.textContent = '✗ Failed';
        setTimeout(() => {
            indicator.textContent = 'Click to copy';
        }, 2000);
    }
}

function openPanel() {
    const panel = document.getElementById('sbl-panel');
    const backdrop = document.getElementById('sbl-backdrop');
    if (panel) panel.classList.add('sbl-panel-open');
    if (backdrop) backdrop.classList.add('sbl-backdrop-visible');
}

function closePanel() {
    const panel = document.getElementById('sbl-panel');
    const backdrop = document.getElementById('sbl-backdrop');
    const fab = document.getElementById('sbl-fab');

    if (panel) panel.classList.remove('sbl-panel-open');
    if (backdrop) backdrop.classList.remove('sbl-backdrop-visible');
    if (fab) fab.classList.remove('sbl-fab-hidden');
}

function togglePanel() {
    const panel = document.getElementById('sbl-panel');
    if (panel && panel.classList.contains('sbl-panel-open')) {
        closePanel();
    } else {
        openPanel();
        const fab = document.getElementById('sbl-fab');
        if (fab) fab.classList.add('sbl-fab-hidden');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSBLLibrarian);
} else {
    initSBLLibrarian();
}