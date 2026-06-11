const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('file:///C:/Users/ADMIN/Documents/GitHub/pvz-web/index.html');
  await sleep(1500);

  // Start level 1-1
  await page.evaluate(() => { openSeedChooser('1-1'); });
  await sleep(500);
  await page.evaluate(() => { document.getElementById('seed-start-btn').click(); });
  await sleep(2000);

  // Check game state
  const state1 = await page.evaluate(() => {
    return {
      gameState, currentLevelId, currentLevel: currentLevel?.name,
      credits, score, waveStarted, waveActive, currentWave,
      totalWaves: typeof WAVES !== 'undefined' ? WAVES.length : 0,
      gridReady: grid.length > 0,
      towerCount: towers.length,
      threatCount: threats.length,
      threats: threats.map(t => ({ type: t.type, row: t.row, x: Math.round(t.x), hp: t.hp })),
      aiEnabled: AI_CONFIG.enabled
    };
  });
  console.log('=== Game State ===');
  console.log(JSON.stringify(state1, null, 2));

  // Check legal actions
  const legalActions = await page.evaluate(() => {
    return AI.getLegalActions();
  });
  console.log('\n=== Legal Actions ===');
  console.log('Total:', legalActions.length);
  const placeActions = legalActions.filter(a => a.type === 'place_tower');
  console.log('Place tower actions:', placeActions.length);
  placeActions.slice(0, 10).forEach(a => {
    console.log('  ' + a.tower + ' @R' + a.row + 'C' + a.col);
  });

  // Toggle AI and let it decide once
  await page.evaluate(() => {
    if (!AI_CONFIG.enabled) AI.toggle();
  });
  await sleep(2000);

  // Check what AI did
  const state2 = await page.evaluate(() => {
    return {
      credits, towerCount: towers.length, threatCount: threats.length,
      towerPositions: towers.map(t => t.key + '@R' + t.row + 'C' + t.col),
      aiLastAction: typeof aiLastAction !== 'undefined' ? aiLastAction : 'none'
    };
  });
  console.log('\n=== After AI Toggle (2s) ===');
  console.log(JSON.stringify(state2, null, 2));

  // Wait more
  await sleep(10000);
  const state3 = await page.evaluate(() => {
    return {
      credits, towerCount: towers.length, threatCount: threats.length,
      towerPositions: towers.map(t => t.key + '@R' + t.row + 'C' + t.col),
      aiLastAction: typeof aiLastAction !== 'undefined' ? aiLastAction : 'none',
      waveStarted, waveActive, currentWave
    };
  });
  console.log('\n=== After 12s ===');
  console.log(JSON.stringify(state3, null, 2));

  if (errors.length > 0) console.log('\nErrors:', errors);

  await browser.close();
})();
