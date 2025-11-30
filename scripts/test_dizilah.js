const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testDizilah() {
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
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Navigating to dizilah.com/ratings...');
        await page.goto('https://dizilah.com/ratings', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Waiting for table...');
        try {
            await page.waitForSelector('table', { timeout: 10000 });

            // Wait a bit more for hydration
            await new Promise(r => setTimeout(r, 5000));

            await page.screenshot({ path: 'dizilah_debug.png' });

            const data = await page.evaluate(() => {
                const table = document.querySelector('table');
                if (!table) return null;

                const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
                const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 3).map(tr => {
                    return Array.from(tr.querySelectorAll('td')).map(td => ({
                        text: td.innerText.trim(),
                        html: td.innerHTML
                    }));
                });

                return { headers, rows };
            });

            console.log('Table Data:', JSON.stringify(data, null, 2));

        } catch (e) {
            console.log('Table not found or timed out.');
            const bodyText = await page.evaluate(() => document.body.innerText);
            console.log('Body text preview:', bodyText.substring(0, 200));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testDizilah();
