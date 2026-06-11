const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LEVELS_TO_TEST = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'];
const TIMEOUT_PER_LEVEL = 240000;

async function testLevel(browser, levelId) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto('file:///C:/Users/ADMIN/Documents/GitHub/pvz-web/index.html');
  await sleep(1500);

  // Check level exists
  const levelExists = await page.evaluate((id) => !!LEVEL_DATABASE[id], levelId);
  if (!levelExists) {
    await page.close();
    return { level: levelId, result: 'SKIP', reason: 'Level not found' };
  }

  // Unlock all towers for this level, then open seed chooser
  await page.evaluate((id) => {
    const lvl = LEVEL_DATABASE[id];
    if (!lvl) return;
    if (lvl && lvl.unlockedTowers) {
      lvl.unlockedTowers.forEach(k => {
        if (!saveData.inventory.unlockedTowers.includes(k)) {
          saveData.inventory.unlockedTowers.push(k);
        }
      });
    }
    openSeedChooser(id);
  }, levelId);
  await sleep(500);

  // Pick all available towers (seed chooser limits to seedSlots)
  const picked = await page.evaluate(() => {
    const inv = document.getElementById('inventory');
    const cards = inv.querySelectorAll('.inv-card:not(.picked)');
    let count = 0;
    for (const card of cards) {
      card.click();
      count++;
    }
    return count;
  });

  if (picked === 0) {
    await page.close();
    return { level: levelId, result: 'ERROR', reason: 'No towers to pick' };
  }

  await sleep(300);

  // Click "Let's Rock"
  await page.evaluate(() => document.getElementById('lets-rock-btn').click());
  await sleep(2000);

  // Verify game started
  const playCheck = await page.evaluate(() => ({
    gameState, currentLevelId, credits, waveStarted, towerCount: towers.length
  }));

  if (playCheck.gameState !== 'PLAYING') {
    await page.close();
    return { level: levelId, result: 'ERROR', reason: 'Game state: ' + playCheck.gameState };
  }

  // Toggle AI ON
  await page.evaluate(() => { if (!AI_CONFIG.enabled) AI.toggle(); });
  await sleep(1000);

  // Verify AI is on
  const aiCheck = await page.evaluate(() => AI_CONFIG.enabled);
  if (!aiCheck) {
    await page.close();
    return { level: levelId, result: 'ERROR', reason: 'AI failed to toggle on' };
  }

  // Poll every 3s
  const startTime = Date.now();
  let finalState = null;
  let timeline = [];
  let lastWave = -1;

  while (Date.now() - startTime < TIMEOUT_PER_LEVEL) {
    await sleep(3000);
    const s = await page.evaluate(() => ({
      gameOver, gameWon, credits, score,
      towerCount: towers.length,
      threatCount: threats.length,
      currentWave, totalWaves: WAVES.length,
      waveActive, waveStarted,
      aiLastAction: aiLastAction || '',
      towerPositions: towers.map(t => t.key + '@R' + t.row + 'C' + t.col)
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    if (s.currentWave !== lastWave || s.towerCount !== timeline.length) {
      timeline.push(elapsed + 's w=' + s.currentWave + '/' + s.totalWaves +
        ' t=' + s.towerCount + ' th=' + s.threatCount +
        ' $=' + s.credits + ' act=' + s.aiLastAction);
      lastWave = s.currentWave;
    }

    if (s.gameOver || s.gameWon) {
      finalState = s;
      break;
    }
    finalState = s;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  await page.close();

  return {
    level: levelId,
    result: finalState.gameWon ? 'WIN' : finalState.gameOver ? 'LOSS' : 'TIMEOUT',
    elapsed: elapsed + 's',
    towers: finalState.towerCount,
    wave: (finalState.currentWave + 1) + '/' + finalState.totalWaves,
    score: finalState.score,
    credits: finalState.credits,
    towerPositions: finalState.towerPositions,
    timeline: timeline.slice(-8),
    errors: jsErrors.slice(0, 3)
  };
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = [];

  for (const level of LEVELS_TO_TEST) {
    process.stdout.write(level + '... ');
    const r = await testLevel(browser, level);
    results.push(r);
    const icon = r.result === 'WIN' ? '✅' : r.result === 'LOSS' ? '❌' : '🚫';
    console.log(icon + ' ' + r.result + ' towers:' + r.towers + ' wave:' + r.wave + ' score:' + r.score);
    if (r.timeline) r.timeline.forEach(t => console.log('  ' + t));
    if (r.errors && r.errors.length > 0) console.log('  ERR:', r.errors[0]);
  }

  console.log('\n=== SUMMARY ===');
  console.log('Wins: ' + results.filter(r => r.result === 'WIN').length + '/' + results.length);
  console.log('Losses: ' + results.filter(r => r.result === 'LOSS').length);
  console.log('Other: ' + results.filter(r => r.result !== 'WIN' && r.result !== 'LOSS').length);

  await browser.close();
})();
