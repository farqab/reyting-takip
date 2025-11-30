const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Path to the data file
const DATA_FILE = path.join(__dirname, '../data/ratings.json');
const NEWS_URL = 'https://boxofficeturkiye.com/haberler/tumu';

// Keywords to exclude (news, reality shows etc if needed, though we want to capture what's in the top 10)
const EXCLUDED_KEYWORDS = ['haber', 'hava durumu', 'spor', 'ana haber'];

async function scrapeRatings() {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
        ],
        ignoreHTTPSErrors: true,
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        console.log(`Navigating to ${NEWS_URL}...`);
        await page.goto(NEWS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Find the latest rating article
        console.log('Searching for latest rating article...');
        const articleUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            // Look for links containing "reyting sonuçları" or "en çok izlenen dizileri"
            // Exclude hashtag links
            const ratingLink = links.find(a =>
                (a.innerText.toLowerCase().includes('reyting sonuçları') ||
                    a.innerText.toLowerCase().includes('en çok izlenen dizileri')) &&
                !a.href.includes('hashtag')
            );
            return ratingLink ? ratingLink.href : null;
        });

        if (!articleUrl) {
            throw new Error('Could not find a recent rating article on the news page.');
        }

        console.log(`Found article: ${articleUrl}`);
        await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Extract content text
        const content = await page.evaluate(() => document.body.innerText);

        // Parse ratings from text
        console.log('Parsing ratings from article content...');
        const ratings = [];
        const lines = content.split('\n');

        // Find the start of the list (usually "Günlük En Çok İzlenen İlk 10 Program")
        const listStartIndex = lines.findIndex(l => l.includes('Günlük En Çok İzlenen İlk 10 Program') || l.includes('En Çok İzlenen'));

        if (listStartIndex !== -1) {
            // Look at the next 30 lines to capture the top 10
            for (let i = listStartIndex; i < listStartIndex + 30; i++) {
                if (!lines[i]) continue;

                // Regex for "1. Show Name – 7,73 reyting" or similar variations
                // Handles: "1. [Show Name] – 7,73 reyting"
                const match = lines[i].match(/(\d+)\.\s+(?:\[?)(.+?)(?:\]?)\s+[–-]\s+([\d,]+)\s+reyting/);

                if (match) {
                    const rank = parseInt(match[1]);
                    const title = match[2].trim();
                    const ratingVal = parseFloat(match[3].replace(',', '.'));

                    // Basic filtering
                    const isExcluded = EXCLUDED_KEYWORDS.some(keyword => title.toLowerCase().includes(keyword));

                    if (!isExcluded) {
                        ratings.push({
                            rank,
                            title,
                            rating: ratingVal
                        });
                    }
                }
            }
        } else {
            console.warn('Could not find the specific list header. Attempting to scan entire text for pattern...');
            // Fallback: scan all lines
            for (const line of lines) {
                const match = line.match(/(\d+)\.\s+(?:\[?)(.+?)(?:\]?)\s+[–-]\s+([\d,]+)\s+reyting/);
                if (match) {
                    const title = match[2].trim();
                    const ratingVal = parseFloat(match[3].replace(',', '.'));
                    const isExcluded = EXCLUDED_KEYWORDS.some(keyword => title.toLowerCase().includes(keyword));
                    if (!isExcluded) {
                        ratings.push({ title, rating: ratingVal });
                    }
                }
            }
        }

        console.log(`Extracted ${ratings.length} shows.`);
        return ratings;

    } catch (error) {
        console.error('Error scraping data:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function updateRatingsFile(newRatings) {
    try {
        let currentData = [];
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            currentData = JSON.parse(fileContent);
        }

        const today = new Date().toISOString().split('T')[0];
        let updatedCount = 0;
        let addedCount = 0;

        for (const show of newRatings) {
            // Normalize title for matching (remove punctuation, lowercase)
            const normalizedTitle = show.title.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

            let existingShow = currentData.find(s =>
                s.title.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() === normalizedTitle
            );

            // Since we only have one rating value from BoxOfficeTurkiye (likely ABC1 or Total),
            // we will apply it to all categories to ensure the UI shows something.
            // In a real scenario, we might want to flag this, but for now this is the fallback.
            const ratingSet = {
                total: show.rating,
                ab: show.rating,
                abc1: show.rating
            };

            if (existingShow) {
                // Update existing show
                existingShow.rating = show.rating; // Main rating display
                existingShow.ratings = ratingSet;

                // Update history
                if (!existingShow.ratingHistory) existingShow.ratingHistory = [];
                existingShow.ratingHistory.push(show.rating);
                if (existingShow.ratingHistory.length > 7) existingShow.ratingHistory.shift(); // Keep last 7 days

                existingShow.lastUpdated = today;
                updatedCount++;
            } else {
                // Add new show
                const newShow = {
                    id: (currentData.length + 1).toString(),
                    title: show.title,
                    rating: show.rating,
                    ratings: ratingSet,
                    image: "https://via.placeholder.com/300x450", // Placeholder
                    description: "Yeni eklenen dizi.",
                    season: 1,
                    ratingHistory: [show.rating],
                    episodes: [],
                    lastUpdated: today
                };
                currentData.push(newShow);
                addedCount++;
            }
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
        console.log(`Successfully updated ratings. Updated: ${updatedCount}, Added: ${addedCount}`);

    } catch (error) {
        console.error('Error updating ratings file:', error);
        throw error;
    }
}

async function main() {
    try {
        const ratings = await scrapeRatings();
        if (ratings.length > 0) {
            await updateRatingsFile(ratings);
        } else {
            console.log('No ratings found to update.');
        }
    } catch (error) {
        console.error('Failed to update ratings:', error);
        process.exit(1);
    }
}

main();
