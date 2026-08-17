const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to local server
  await page.goto('http://localhost:8000');

  // Wait for sprites to load
  await new Promise(r => setTimeout(r, 500));

  // Take a screenshot of the main menu
  await page.screenshot({ path: 'screenshot_menu.png' });

  // Click start (Prologue)
  await page.mouse.click(500, 300); // Click anywhere to start
  await new Promise(r => setTimeout(r, 100));

  // Screenshot Prologue
  await page.screenshot({ path: 'screenshot_prologue.png' });

  // Wait for character selection screen (approx 5s based on survivalTime=25)
  await new Promise(r => setTimeout(r, 6000));

  // Screenshot character select
  await page.screenshot({ path: 'screenshot_char_select.png' });

  // Select Kael
  await page.mouse.click(250, 450);

  // Wait for intro transition
  await new Promise(r => setTimeout(r, 4000));

  // Take screenshot of Stage 1 Level 1
  await page.screenshot({ path: 'screenshot_level_1.png' });

  await browser.close();
})();
