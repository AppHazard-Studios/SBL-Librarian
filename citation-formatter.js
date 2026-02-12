const SERIES_ABBREVIATIONS = {
    'The Bible Speaks Today': 'BST',
    'The Bible Speaks Today Ser.': 'BST',
    'Baker Exegetical Commentary on the New Testament': 'BECNT',
    'New International Commentary on the New Testament': 'NICNT',
    'New International Commentary on the Old Testament': 'NICOT',
    'Pillar New Testament Commentary': 'PNTC',
    'Tyndale Old Testament Commentaries': 'TOTC',
    'Tyndale New Testament Commentaries': 'TNTC',
    'Word Biblical Commentary': 'WBC',
    'New International Greek Testament Commentary': 'NIGTC',
    'Anchor Bible': 'AB',
    'Anchor Yale Bible': 'AYB',
    'Hermeneia': 'Herm',
    'International Critical Commentary': 'ICC',
    'New Cambridge Bible Commentary': 'NCBC',
    'Zondervan Exegetical Commentary on the New Testament': 'ZECNT',
    'Zondervan Exegetical Commentary on the Old Testament': 'ZECOT',
    'Brazos Theological Commentary on the Bible': 'BTCB',
    'Eerdmans Critical Commentary': 'ECC',
    'New Testament Library': 'NTL',
    'Old Testament Library': 'OTL',
    'Understanding the Bible Commentary Series': 'Understanding the Bible Commentary Series'
};

function formatCitations(data) {
    const cleanedTitle = cleanTitle(data.title, data.series);
    const authorParts = parseAuthorName(data.author);
    const shortTitle = generateShortTitle(cleanedTitle);
    const seriesStr = formatSeries(data.series);

    // Ensure we have required fields
    if (!authorParts.full || !cleanedTitle || !data.publisher || !data.year) {
        console.warn('Missing required citation fields:', data);
    }

    const firstFootnote = buildFirstFootnote(cleanedTitle, data, authorParts, seriesStr);
    const laterFootnote = buildLaterFootnote(authorParts, shortTitle);
    const bibliography = buildBibliography(cleanedTitle, data, authorParts, seriesStr);

    return { firstFootnote, laterFootnote, bibliography };
}

function cleanTitle(title, series) {
    if (!title) return title;
    if (!series) return title;

    const seriesClean = series.replace(/\s+Ser\.$/, '').trim();

    // Pattern 1: Colon/dash at end - "Title: Series" or "Title - Series"
    const colonPattern = new RegExp(`[:\\-]\\s*${escapeRegex(seriesClean)}$`, 'i');
    title = title.replace(colonPattern, '').trim();

    // Pattern 2: Brackets - "Title (Series)" or "Title [Series]"
    const bracketPattern = new RegExp(`[\\(\\[]\\s*${escapeRegex(seriesClean)}\\s*[\\)\\]]`, 'gi');
    title = title.replace(bracketPattern, '').trim();

    // Pattern 3: Comma at end - "Title, Series"
    const commaPattern = new RegExp(`,\\s*${escapeRegex(seriesClean)}$`, 'i');
    title = title.replace(commaPattern, '').trim();

    // Clean up any trailing punctuation
    title = title.replace(/[,:\\-]+$/, '').trim();

    return title;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAuthorName(authorString) {
    if (!authorString) return { full: '', last: '', firstLast: '' };

    // Clean up extra whitespace
    authorString = authorString.trim().replace(/\s+/g, ' ');

    // Split by spaces
    const parts = authorString.split(/\s+/);

    if (parts.length === 0) {
        return { full: '', last: '', firstLast: '' };
    }

    if (parts.length === 1) {
        // Single name (unusual but handle it)
        return {
            full: parts[0],
            last: parts[0],
            firstLast: parts[0]
        };
    }

    // Standard case: FirstName(s) LastName
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');

    return {
        full: authorString,
        last: lastName,
        firstLast: `${lastName}, ${firstName}`
    };
}

function generateShortTitle(title) {
    if (!title) return '';

    // Remove leading articles
    let cleaned = title.replace(/^(The|A|An)\s+/i, '').trim();

    if (!cleaned) return title; // Fallback if title was only "The"

    const words = cleaned.split(/\s+/);

    // If title is very short, use it all
    if (words.length <= 3) return cleaned;

    // Take first 2-3 words, stopping at natural breaks
    let shortWords = [];
    for (let i = 0; i < Math.min(3, words.length); i++) {
        const word = words[i];
        // Stop if we hit punctuation that indicates end of main title
        if (word.includes(':') || word.includes('—') || word.includes('–')) {
            shortWords.push(word.replace(/[:—–]/, ''));
            break;
        }
        shortWords.push(word);
    }

    return shortWords.join(' ');
}

function formatSeries(seriesRaw) {
    if (!seriesRaw) return '';

    // Clean up "Ser." suffix that ProQuest adds
    let series = seriesRaw.replace(/\s+Ser\.$/, '').trim();

    // Check for standard abbreviation (exact match)
    if (SERIES_ABBREVIATIONS[series]) {
        return SERIES_ABBREVIATIONS[series];
    }

    // Also check original with "Ser." suffix
    if (SERIES_ABBREVIATIONS[seriesRaw]) {
        return SERIES_ABBREVIATIONS[seriesRaw];
    }

    // No standard abbreviation - return cleaned full name
    return series;
}

function buildFirstFootnote(title, data, author, series) {
    const seriesStr = series ? `, ${series}` : '';
    const place = data.place || 'Place';
    const publisher = data.publisher || 'Publisher';
    const year = data.year || 'Year';

    const html = `${author.full}, <em>${title}</em>${seriesStr} (${place}: ${publisher}, ${year}), xx–xx.`;
    const plain = `${author.full}, *${title}*${seriesStr} (${place}: ${publisher}, ${year}), xx–xx.`;

    return { html, plain };
}

function buildLaterFootnote(author, shortTitle) {
    const html = `${author.last}, <em>${shortTitle}</em>, xx.`;
    const plain = `${author.last}, *${shortTitle}*, xx.`;

    return { html, plain };
}

function buildBibliography(title, data, author, series) {
    const seriesStr = series ? ` ${series}.` : '';
    const place = data.place || 'Place';
    const publisher = data.publisher || 'Publisher';
    const year = data.year || 'Year';

    // Fix double period: check if firstLast already ends with period
    const authorStr = author.firstLast.endsWith('.')
        ? author.firstLast
        : `${author.firstLast}.`;

    const html = `${authorStr} <em>${title}</em>.${seriesStr} ${place}: ${publisher}, ${year}.`;
    const plain = `${authorStr} *${title}*.${seriesStr} ${place}: ${publisher}, ${year}.`;

    return { html, plain };
}