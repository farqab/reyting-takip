// Regex to find links like "29 Kasım 2025 Reyting Sonuçları" or similar
// Or just the first link in the main content area
const ratingLink = links.find(a =>
    (a.innerText.includes('Reyting Sonuçları') || a.innerText.match(/\d{1,2}\s+[A-Za-zİıĞğÜüŞşÖöÇç]+\s+\d{4}/)) &&
    !a.href.includes('twitter') && !a.href.includes('facebook')
);
return ratingLink ? ratingLink.href : null;
        });

if (!articleUrl) {
    throw new Error('Could not find a valid ratings article link on the main page.');
}

console.log(`Found ratings article: ${articleUrl}`);
await page.goto(articleUrl, { waitUntil: 'networkidle2', timeout: 60000 });

// 2. Extract data from the table(s)
// There might be multiple tables (Total, AB, ABC1) or one big table.
// We need to handle both cases.

const scrapedData = await page.evaluate(() => {
    const results = [];
    const tables = document.querySelectorAll('table');

    // Helper to parse a table
    const parseTable = (table, category) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        rows.forEach((row, index) => {
            if (index === 0) return; // Skip header
            const cols = row.querySelectorAll('td');
            if (cols.length >= 3) {
                // Assumption: Rank | Title | Channel | Rating | Share
                // Adjust based on visual inspection if possible, but standard is usually:
                // 0: Rank, 1: Title, 2: Channel, 3: Rating, 4: Share

                const titleEl = cols[1];
                const ratingEl = cols[3];
                const channelEl = cols[2];

                if (titleEl && ratingEl) {
                    const title = titleEl.innerText.trim();
                    const ratingText = ratingEl.innerText.trim().replace(',', '.');
                    const rating = parseFloat(ratingText);
                    const channel = channelEl ? channelEl.innerText.trim() : '';

                    if (title && !isNaN(rating)) {
                        // Check if we already have this show in results
                        let existing = results.find(r => r.title === title);
                        if (!existing) {
                            existing = {
                                title,
                                channel,
                                ratings: { total: 0, ab: 0, abc1: 0 }
                            };
                            results.push(existing);
                        }

                        // Assign rating to category
                        if (category) {
                            existing.ratings[category] = rating;
                        } else {
                            // If no category known, assume Total or try to guess from header
                            // For now, let's assume the first table is Total, second AB, third ABC1 if we find 3 tables
                            // This logic is handled outside
                        }
                    }
                }
            }
        });
    };

    // Heuristic: Identify tables by headers or order
    // Usually: Total, AB, ABC1
    if (tables.length >= 3) {
        parseTable(tables[0], 'total');
        parseTable(tables[1], 'ab');
        parseTable(tables[2], 'abc1');
    } else if (tables.length === 1) {
        // Maybe one big table? Or just Total?
        parseTable(tables[0], 'total');
    } else {
        // Try to find headers nearby
        tables.forEach((table, i) => {
            // Default to Total, AB, ABC1 order
            const cat = i === 0 ? 'total' : (i === 1 ? 'ab' : 'abc1');
            parseTable(table, cat);
        });
    }

    return results;
});

console.log(`Scraped ${scrapedData.length} items.`);

// 3. Update existing data and add new shows
const rawData = fs.readFileSync(DATA_FILE);
let shows = JSON.parse(rawData);
let updatedCount = 0;
let newCount = 0;

// Filter for "Dizi" (Series)
// Heuristic: Exclude known non-series keywords
const EXCLUDED_KEYWORDS = ['HABER', 'SPOR', 'YARISMA', 'PROGRAM', 'GÜNDEM', 'HAVA', 'SİNEMA', 'FİLM', 'GÜLDÜR', 'MASTERCHEF', 'SURVIVOR', 'MUGE ANLI', 'ESRA EROL'];

const isSeries = (title) => {
    const upper = title.toUpperCase();
    return !EXCLUDED_KEYWORDS.some(k => upper.includes(k));
};

scrapedData.forEach(scrapedShow => {
    if (!isSeries(scrapedShow.title)) return;

    const normalizedTitle = normalize(scrapedShow.title);
    const existingShowIndex = shows.findIndex(s => normalize(s.title) === normalizedTitle || normalizedTitle.includes(normalize(s.title)));

    if (existingShowIndex !== -1) {
        // Update existing
        const show = shows[existingShowIndex];
        const newRating = scrapedShow.ratings.total || show.rating; // Fallback to old if 0

        // Update history
        const newHistory = [...(show.ratingHistory || []), newRating];
        if (newHistory.length > 30) newHistory.shift();

        shows[existingShowIndex] = {
            ...show,
            rating: newRating,
            ratings: scrapedShow.ratings,
            ratingHistory: newHistory,
            lastUpdated: new Date().toISOString()
        };
        updatedCount++;
    } else {
        // Add new show
        // Only add if it has a valid Total rating
        if (scrapedShow.ratings.total > 0) {
            const newId = (shows.length + 1 + newCount).toString();
            shows.push({
                id: newId,
                title: scrapedShow.title,
                rating: scrapedShow.ratings.total,
                ratings: scrapedShow.ratings,
                image: 'https://via.placeholder.com/300x450', // Placeholder
                description: `${scrapedShow.channel} kanalında yayınlanan dizi.`,
                season: 1,
                ratingHistory: [scrapedShow.ratings.total],
                episodes: []
            });
            newCount++;
            console.log(`Added new show: ${scrapedShow.title}`);
        }
    }
});

console.log(`Updated ${updatedCount} shows. Added ${newCount} new shows.`);
return shows;

    } catch (error) {
    console.error('Error scraping data:', error);
    throw error;
} finally {
    await browser.close();
}
}

async function main() {
    try {
        const updatedData = await scrapeRatings();
        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2));
        console.log('Ratings.json updated successfully!');
    } catch (error) {
        console.error('Failed to update ratings:', error);
        process.exit(1);
    }
}

main();
