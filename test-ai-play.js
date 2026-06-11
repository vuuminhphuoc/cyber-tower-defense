const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('file:///C:/Users/ADMIN/Documents/GitHub/pvz-web/index.html');
  await page.waitForSelector('#level-1-1', { timeout: 5000 });

  // click level 1-1
  await page.click('#level-1-1');
  await page.waitForTimeout(500);

  // confirm seed
  const startBtn = await page.$('#seed-start-btn');
  if (startBtn) await startBtn.click();
  await page.waitForTimeout(1000);

  // toggle AI on
  const aiBtn = await page.$('#ai-btn');
  if (aiBtn) {
    await aiBtn.click();
    console.log('AI toggled ON');
  }

  // let AI play for 45 seconds
  console.log('AI playing level 1-1 for 45 seconds...');
  await page.waitForTimeout(45000);

  // check game state
  const state = await page.evaluate(() => {
    return {
      gameOver: typeof gameOver !== 'undefined' ? gameOver : null,
      gameWon: typeof gameWon !== 'undefined' ? gameWon : null,
      credits: typeof credits !== 'undefined' ? credits : null,
      towers: typeof towers !== 'undefined' ? towers.length : null,
      threats: typeof threats !== 'undefined' ? threats.length : null,
      wave: typeof currentWave !== 'undefined' ? currentWave : null,
      score: typeof score !== 'undefined' ? score : null,
      towerPositions: typeof towers !== 'undefined' ? towers.map(t => t.key + '@' + t.row + ',' + t.col) : []
    };
  });
  console.log('Game state:', JSON.stringify(state, null, 2));

  await browser.close();
})();
