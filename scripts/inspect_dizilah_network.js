const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function inspectNetwork() {
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

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('api') || url.includes('json') || url.includes('rating')) {
                console.log('Response URL:', url);
                try {
                    const json = await response.json();
                    console.log('Response Data:', JSON.stringify(json).substring(0, 500));
                } catch (e) {
                    // Not JSON
                }
            }
        });

        console.log('Navigating to dizilah.com/ratings...');
        await page.goto('https://dizilah.com/ratings', { waitUntil: 'networkidle2', timeout: 60000 });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

inspectNetwork();
