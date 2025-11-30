const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Path to the data file
const DATA_FILE = path.join(__dirname, '../data/ratings.json');
const BASE_URL = 'https://www.ranini.tv/reyting';

// Helper to normalize strings for fuzzy matching
function normalize(str) {
    return str.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
}

async function scrapeRatings() {
    console.log(`Launching Puppeteer...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ],
        ignoreHTTPSErrors: true
    });

    try {
        const page = await browser.newPage();
        // Use a modern User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Add extra headers to look like a real browser
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        });

        console.log(`Navigating to ${BASE_URL}...`);
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 1. Find the latest ratings link
        const articleUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            // Regex to find links like "29 Kasım 2025 Reyting Sonuçları" or similar
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
        await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 2. Extract data from the table(s)
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
                        const titleEl = cols[1];
                        const ratingEl = cols[3];
                        const channelEl = cols[2];

                        if (titleEl && ratingEl) {
                            const title = titleEl.innerText.trim();
                            const ratingText = ratingEl.innerText.trim().replace(',', '.');
                            const rating = parseFloat(ratingText);
                            const channel = channelEl ? channelEl.innerText.trim() : '';

                            if (title && !isNaN(rating)) {
                                let existing = results.find(r => r.title === title);
                                if (!existing) {
                                    existing = {
                                        title,
                                        channel,
                                        ratings: { total: 0, ab: 0, abc1: 0 }
                                    };
                                    results.push(existing);
                                }

                                if (category) {
                                    existing.ratings[category] = rating;
                                }
                            }
                        }
                    }
                });
            };

            // Heuristic: Identify tables by headers or order
            if (tables.length >= 3) {
                parseTable(tables[0], 'total');
                parseTable(tables[1], 'ab');
                parseTable(tables[2], 'abc1');
            } else if (tables.length === 1) {
                parseTable(tables[0], 'total');
            } else {
                tables.forEach((table, i) => {
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
                const newRating = scrapedShow.ratings.total || show.rating;

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
                if (scrapedShow.ratings.total > 0) {
                    const newId = (shows.length + 1 + newCount).toString();
                    shows.push({
                        id: newId,
                        title: scrapedShow.title,
                        rating: scrapedShow.ratings.total,
                        ratings: scrapedShow.ratings,
                        image: 'https://via.placeholder.com/300x450',
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
