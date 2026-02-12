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

    // Handle author vs editor
    let authorString = data.author;
    let useEditor = false;

    if (!authorString && data.editor) {
        authorString = data.editor;
        useEditor = true;
    }

    const authorParts = parseAuthorName(authorString, useEditor);

    // Detect volume in title for multivolume works
    const volumeInfo = extractVolumeFromTitle(cleanedTitle);

    const shortTitle = generateShortTitle(cleanedTitle);
    const seriesStr = formatSeries(data.series);

    // Ensure we have required fields
    if (!authorParts.full || !cleanedTitle || !data.publisher || !data.year) {
        console.warn('Missing required citation fields:', data);
    }

    const firstFootnote = buildFirstFootnote(cleanedTitle, data, authorParts, seriesStr);
    const laterFootnote = buildLaterFootnote(authorParts, shortTitle, volumeInfo);
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

function extractVolumeFromTitle(title) {
    if (!title) return null;

    // Pattern to detect volume info in title
    // Matches: "vol. 1", "Vol. 1", "Volume 1", "volume 1"
    // Can be followed by comma, colon, period, or space
    const volumePattern = /\b(?:vol\.?|volume)\s*(\d+)/i;
    const match = title.match(volumePattern);

    if (match) {
        return {
            hasVolume: true,
            number: match[1] // Just the number (e.g., "1", "2", "3")
        };
    }

    return null;
}

function parseAuthorName(authorString, isEditor = false) {
    if (!authorString) return { full: '', last: '', firstLast: '', count: 0 };

    // Clean up HTML artifacts and whitespace
    authorString = authorString
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\s+and\s+/gi, ' and ')
        .trim()
        .replace(/\s+/g, ' ');

    // Split authors by " and "
    const authors = authorString.split(' and ').map(a => a.trim()).filter(a => a);

    if (authors.length === 0) {
        return { full: '', last: '', firstLast: '', count: 0 };
    }

    const count = authors.length;

    // SBL Rules for footnotes/citations:
    // 1 author: Full name
    // 2 authors: Both full names with "and"
    // 3+ authors: First author et al.

    if (count === 1) {
        const parts = authors[0].split(/\s+/);
        if (parts.length === 1) {
            const suffix = isEditor ? ', ed.' : '';
            return {
                full: parts[0] + suffix,
                last: parts[0],
                firstLast: parts[0] + suffix,
                count: 1
            };
        }

        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        const suffix = isEditor ? ', ed.' : '';

        return {
            full: authors[0] + suffix,
            last: lastName,
            firstLast: `${lastName}, ${firstName}` + suffix,
            count: 1
        };
    }

    if (count === 2) {
        // Parse both names
        const author1Parts = authors[0].split(/\s+/);
        const author2Parts = authors[1].split(/\s+/);

        const lastName1 = author1Parts[author1Parts.length - 1];
        const firstName1 = author1Parts.slice(0, -1).join(' ');

        const lastName2 = author2Parts[author2Parts.length - 1];
        const firstName2 = author2Parts.slice(0, -1).join(' ');

        const suffix = isEditor ? ', eds.' : '';

        return {
            full: `${authors[0]} and ${authors[1]}` + suffix,
            last: lastName1, // First author's last name for later footnotes
            firstLast: `${lastName1}, ${firstName1}, and ${firstName2} ${lastName2}` + suffix,
            count: 2
        };
    }

    // 3+ authors: et al. in footnotes
    const firstAuthor = authors[0];
    const parts = firstAuthor.split(/\s+/);
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');

    const suffix = isEditor ? ', eds.' : '';

    // For bibliography (firstLast), we need ALL authors spelled out
    const allAuthorsForBib = authors.map((author, idx) => {
        const authorParts = author.split(/\s+/);
        const last = authorParts[authorParts.length - 1];
        const first = authorParts.slice(0, -1).join(' ');

        if (idx === 0) {
            return `${last}, ${first}`;
        } else {
            return `${first} ${last}`;
        }
    }).join(', ');

    return {
        full: `${firstAuthor} et al.` + suffix,
        last: lastName,
        firstLast: allAuthorsForBib + suffix,
        count: count,
        allAuthors: authors // Store for potential future use
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

function buildLaterFootnote(author, shortTitle, volumeInfo) {
    // SBL format for multivolume works: Author, Short Title, volume:page
    // Otherwise: Author, Short Title, page

    if (volumeInfo && volumeInfo.hasVolume) {
        // Use volume:page format (e.g., "1:xx" or "1:xx–xx")
        const html = `${author.last}, <em>${shortTitle}</em>, ${volumeInfo.number}:xx.`;
        const plain = `${author.last}, *${shortTitle}*, ${volumeInfo.number}:xx.`;
        return { html, plain };
    } else {
        // Standard format without volume
        const html = `${author.last}, <em>${shortTitle}</em>, xx.`;
        const plain = `${author.last}, *${shortTitle}*, xx.`;
        return { html, plain };
    }
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