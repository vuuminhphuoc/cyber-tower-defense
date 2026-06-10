const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function createStaticServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const safePath = path.normalize(urlPath).replace(/^([/\\])+/, '');
    const filePath = path.join(__dirname, safePath || 'index.html');

    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });
}

function fail(message, details) {
  console.error('\nTEST FAILED:', message);
  if (details) console.error(details);
  process.exit(1);
}

(async () => {
  let browser;
  const server = createStaticServer();

  try {
    const port = await new Promise(resolve => server.listen(0, () => resolve(server.address().port)));
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'domcontentloaded' });
    await delay(500);

    if (pageErrors.length) fail('JS error on page load', pageErrors.join('\n'));

    const boot = await page.evaluate(() => ({
      levels: LEVEL_ORDER.length,
      towers: ALL_TOWER_KEYS.length,
      threats: THREAT_KEYS.length,
      state: gameState,
      bugButton: !!document.getElementById('bug-report-btn')
    }));

    if (boot.levels !== 35) fail('Unexpected level count', JSON.stringify(boot, null, 2));
    if (boot.towers !== 26) fail('Unexpected tower count', JSON.stringify(boot, null, 2));
    if (boot.threats !== 14) fail('Unexpected threat count', JSON.stringify(boot, null, 2));
    if (!boot.bugButton) fail('Bug report button missing');
    console.log('PASS: Boot checks', boot);

    const levelIds = await page.evaluate(() => LEVEL_ORDER.slice());

    for (const levelId of levelIds) {
      pageErrors.length = 0;
      consoleErrors.length = 0;

      const result = await page.evaluate((id) => {
        currentLevelId = id;
        currentLevel = LEVEL_DATABASE[id];
        saveData.inventory.unlockedTowers = ALL_TOWER_KEYS.slice();
        saveData.inventory.seedSlots = 9;
        chosenSeeds = currentLevel.unlockedTowers.slice(0, 9);
        if (currentLevel.gridMode === '6_LANE_POOL' && !chosenSeeds.includes('PROXY_NODE')) {
          chosenSeeds[chosenSeeds.length - 1] = 'PROXY_NODE';
        }
        startLevel();
        credits = 9999;
        updateCardsUI();

        for (let i = 0; i < 8; i++) {
          deltaTime = 16.67;
          gameTime += deltaTime;
          update(gameTime);
          render();
        }

        const canvasPixels = Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
        let nonBlankPixels = 0;
        for (let i = 3; i < canvasPixels.length; i += 4) {
          if (canvasPixels[i] !== 0) nonBlankPixels++;
        }

        return {
          levelId: id,
          state: gameState,
          name: currentLevel.name,
          gridMode,
          gridRows,
          cellH: CELL_H,
          waves: WAVES.length,
          cards: document.querySelectorAll('#cards .card').length,
          lawnMowers: lawnMowers.length,
          nonBlankPixels,
          bossLevel: !!currentLevel.bossLevel,
          bossCreated: !!bossZomboss
        };
      }, levelId);

      if (result.state !== 'PLAYING') fail(levelId + ' did not enter PLAYING', JSON.stringify(result, null, 2));
      if (result.waves < 1) fail(levelId + ' has no waves', JSON.stringify(result, null, 2));
      if (result.cards < 1) fail(levelId + ' has no tower cards', JSON.stringify(result, null, 2));
      if (result.lawnMowers !== result.gridRows) fail(levelId + ' mower row mismatch', JSON.stringify(result, null, 2));
      if (result.nonBlankPixels < 1000) fail(levelId + ' canvas appears blank', JSON.stringify(result, null, 2));
      if (result.gridMode === '6_LANE_POOL' && result.gridRows !== 6) fail(levelId + ' pool rows mismatch', JSON.stringify(result, null, 2));
      if (result.gridMode !== '6_LANE_POOL' && result.gridRows !== 5) fail(levelId + ' normal rows mismatch', JSON.stringify(result, null, 2));

      if (result.gridMode === '6_LANE_POOL') {
        const proxyResult = await page.evaluate(() => {
          credits = 9999;
          selectedTowerKey = 'PROXY_NODE';
          tryTower(2, 2);
          selectedTowerKey = 'FIREWALL';
          tryTower(2, 2);
          return {
            base: grid[2][2].baseTower && grid[2][2].baseTower.key,
            tower: grid[2][2].tower && grid[2][2].tower.key,
            towerCount: towers.length
          };
        });
        if (proxyResult.base !== 'PROXY_NODE' || proxyResult.tower !== 'FIREWALL') {
          fail(levelId + ' Proxy Node placement failed', JSON.stringify(proxyResult, null, 2));
        }
      }

      // boss levels: force the boss to spawn and tick it a few times
      if (result.bossLevel) {
        const bossResult = await page.evaluate(() => {
          gameStartTime = 0;
          waveStarted = false;
          gameTime += 6000;
          updateWaves(gameTime);
          for (let i = 0; i < 30; i++) {
            deltaTime = 16.67;
            gameTime += deltaTime;
            update(gameTime);
            render();
          }
          return {
            bossType: currentLevel.bossType || 'ZERO_DAY',
            created: !!bossZomboss,
            bossName: bossZomboss ? bossZomboss.name : null,
            bossHp: bossZomboss ? bossZomboss.hp : null
          };
        }, levelId);
        if (!bossResult.created) fail(levelId + ' boss not created', JSON.stringify(bossResult, null, 2));
        console.log('   boss:', bossResult.bossName || bossResult.bossType, '(' + bossResult.bossHp + ' HP)');
      }

      if (pageErrors.length || consoleErrors.length) {
        fail(levelId + ' produced browser errors', JSON.stringify({ pageErrors, consoleErrors }, null, 2));
      }

      console.log('PASS:', levelId, '-', result.name);
    }

    const bugUrl = await page.evaluate(() => {
      const opened = [];
      const originalOpen = window.open;
      window.open = (url) => { opened.push(url); return null; };
      document.getElementById('bug-report-btn').click();
      document.getElementById('bug-title').value = 'Smoke bug';
      document.getElementById('bug-desc').value = 'Created by automated smoke test';
      document.getElementById('bug-submit').click();
      window.open = originalOpen;
      return opened[0] || '';
    });

    if (!bugUrl.includes('/issues/new') || !bugUrl.includes('%5BBug%5D%20Smoke%20bug')) {
      fail('Bug report URL not generated correctly', bugUrl);
    }
    console.log('PASS: Bug report URL generated');

    await page.screenshot({ path: path.join(__dirname, 'test-screenshot.png'), fullPage: true });
    console.log('\nALL TESTS PASSED');
  } catch (error) {
    fail(error.message, error.stack);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})();
