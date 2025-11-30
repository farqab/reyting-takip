const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testBoxOffice() {
    console.log('Launching browser...');
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

        console.log('Navigating to news list...');
        await page.goto('https://boxofficeturkiye.com/haberler/tumu', { waitUntil: 'domcontentloaded' });

        // Find the latest rating article
        const articleUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const ratingLink = links.find(a =>
                (a.innerText.toLowerCase().includes('reyting sonuçları') ||
                    a.innerText.toLowerCase().includes('en çok izlenen dizileri')) &&
                !a.href.includes('hashtag')
            );
            return ratingLink ? ratingLink.href : null;
        });

        if (!articleUrl) {
            console.log('No rating article found.');
            return;
        }

        console.log('Found article:', articleUrl);
        await page.goto(articleUrl, { waitUntil: 'domcontentloaded' });

        // Extract content
        const content = await page.evaluate(() => document.body.innerText);

        // Parse ratings
        const ratings = [];
        const lines = content.split('\n');
        const listStartIndex = lines.findIndex(l => l.includes('Günlük En Çok İzlenen İlk 10 Program'));

        if (listStartIndex !== -1) {
            console.log('Found list start at line:', listStartIndex);
            // Look at next 15 lines
            for (let i = listStartIndex; i < listStartIndex + 20; i++) {
                if (!lines[i]) continue;
                // Regex for "1. Show Name – 7,73 reyting"
                const match = lines[i].match(/(\d+)\.\s+(.+?)\s+[–-]\s+([\d,]+)\s+reyting/);
                if (match) {
                    ratings.push({
                        rank: match[1],
                        title: match[2].trim(),
                        rating: parseFloat(match[3].replace(',', '.'))
                    });
                }
            }
        } else {
            console.log('List start marker not found. Dumping first 500 chars of content:');
            console.log(content.substring(0, 500));
        }

        console.log('Extracted Ratings:', JSON.stringify(ratings, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testBoxOffice();
