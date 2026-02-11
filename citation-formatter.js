function formatCitations(data) {
    // Parse author name
    const authorParts = parseAuthorName(data.author);

    // Generate short title (first 3-4 significant words)
    const shortTitle = generateShortTitle(data.title);

    // Build series string if exists
    const seriesStr = data.series ? `, ${data.series}` : '';

    // Build citations
    const firstFootnote = buildFirstFootnote(data, authorParts, seriesStr);
    const laterFootnote = buildLaterFootnote(authorParts, shortTitle);
    const bibliography = buildBibliography(data, authorParts, seriesStr);

    return { firstFootnote, laterFootnote, bibliography };
}

function parseAuthorName(authorString) {
    if (!authorString) return { full: '', last: '', firstLast: '' };

    // Handle "FirstName LastName" format
    const parts = authorString.trim().split(/\s+/);
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');

    return {
        full: authorString.trim(),
        last: lastName,
        firstLast: `${lastName}, ${firstName}`
    };
}

function generateShortTitle(title) {
    // Remove articles and take first few words
    const words = title
        .replace(/^(The|A|An)\s+/i, '')
        .split(/\s+/)
        .slice(0, 4)
        .join(' ');
    return words;
}

function buildFirstFootnote(data, author, seriesStr) {
    const html = `${author.full}, <em>${data.title}</em>${seriesStr} (Place: ${data.publisher}, ${data.year}), xx–xx.`;
    const plain = `${author.full}, *${data.title}*${seriesStr} (Place: ${data.publisher}, ${data.year}), xx–xx.`;

    return { html, plain };
}

function buildLaterFootnote(author, shortTitle) {
    const html = `${author.last}, <em>${shortTitle}</em>, xx.`;
    const plain = `${author.last}, *${shortTitle}*, xx.`;

    return { html, plain };
}

function buildBibliography(data, author, seriesStr) {
    const html = `${author.firstLast}. <em>${data.title}</em>.${seriesStr ? ` ${data.series}.` : ''} Place: ${data.publisher}, ${data.year}.`;
    const plain = `${author.firstLast}. *${data.title}*.${seriesStr ? ` ${data.series}.` : ''} Place: ${data.publisher}, ${data.year}.`;

    return { html, plain };
}