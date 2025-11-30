const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Path to the data file
const DATA_FILE = path.join(__dirname, '../data/ratings.json');
const TARGET_URL = 'http://www.ranini.tv/reyting';

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
    console.log(`Launching Puppeteer to fetch ratings from ${TARGET_URL}...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for GitHub Actions
    });

    try {
        const page = await browser.newPage();

        // Set a real user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the ratings table
        // ranini.tv usually has a table with class 'table' or inside a specific container
        // We'll look for generic table rows
        await page.waitForSelector('table tr', { timeout: 10000 });

        // Extract data from the page
        const scrapedData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tr'));
            const results = [];

            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 3) {
                    // Assuming standard layout: Rank | Title | Channel | Rating | ...
                    // Adjust indices based on visual inspection of ranini.tv
                    // Usually: 
                    // Col 0: Rank
                    // Col 1: Title (sometimes inside a link)
                    // Col 2: Channel
                    // Col 3: Rating (Total)

                    const titleEl = cols[1];
                    const ratingEl = cols[3];

                    if (titleEl && ratingEl) {
                        const title = titleEl.innerText.trim();
                        const ratingText = ratingEl.innerText.trim().replace(',', '.');
                        const rating = parseFloat(ratingText);

                        if (title && !isNaN(rating)) {
                            results.push({ title, rating });
                        }
                    }
                }
            });
            return results;
        });

        console.log(`Scraped ${scrapedData.length} items.`);
        if (scrapedData.length > 0) {
            console.log('Sample scraped item:', scrapedData[0]);
        }

        // Load existing data
        const rawData = fs.readFileSync(DATA_FILE);
        const shows = JSON.parse(rawData);

        let updatedCount = 0;

        const updatedShows = shows.map(show => {
            const normalizedTitle = normalize(show.title);

            // Find matching show in scraped data
            const match = scrapedData.find(item => normalize(item.title).includes(normalizedTitle) || normalizedTitle.includes(normalize(item.title)));

            if (match) {
                console.log(`Found update for ${show.title}: ${match.rating}`);

                // Update history
                const newHistory = [...show.ratingHistory, match.rating];
                if (newHistory.length > 30) newHistory.shift(); // Keep last 30 days

                updatedCount++;
                return {
                    ...show,
                    rating: match.rating,
                    ratingHistory: newHistory,
                    lastUpdated: new Date().toISOString()
                };
            } else {
                console.log(`No update found for ${show.title}, keeping old data.`);
                return show;
            }
        });

        console.log(`Updated ${updatedCount} shows.`);
        return updatedShows;

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

        // Save updated data
        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2));
        console.log('Ratings.json updated successfully!');

    } catch (error) {
        console.error('Failed to update ratings:', error);
        process.exit(1);
    }
}

main();
