// =====================================================================
// grid.js — Network grid (Cell), grid initialization & drawing, coordinate conversion
// Depends: config.js (canvas, ctx, COLS, TOP_OFFSET), state.js (grid, gridRows)
// Provides (global): Cell, initGrid, drawLawn, pixelToCell
// Used by: screens.js (startLevel), ui.js (tryPlace), main.js (render)
// =====================================================================

class Cell {
  constructor(x, y, width, height, cellType) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cellType = cellType || 'grass'; // 'grass' | 'water' | 'grave'
    this.tower = null;
    this.baseTower = null; // proxy node on data stream cells
  }
}

function initGrid() {
  grid = [];
  const rows = gridRows;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      let cellType = 'grass';
      // data stream: rows 2-3 are water
      if (gridMode === '6_LANE_POOL' && (r === 2 || r === 3)) cellType = 'water';
      row.push(new Cell(c * CELL_W, TOP_OFFSET + r * ch, CELL_W, ch, cellType));
    }
    grid.push(row);
  }
  // place corrupted blocks (graves equivalent)
  if (currentLevel && currentLevel.graves) {
    currentLevel.graves.forEach(g => {
      if (grid[g.row] && grid[g.row][g.col]) {
        grid[g.row][g.col].cellType = 'grave';
      }
    });
  }
  // place special terrain cells: [{ row, col, type }]
  if (currentLevel && currentLevel.terrain) {
    currentLevel.terrain.forEach(t => {
      if (grid[t.row] && grid[t.row][t.col]) {
        grid[t.row][t.col].cellType = t.type;
        // entangled pairs link two cells: { row, col, type:'entangled', link:{row,col} }
        if (t.type === 'entangled' && t.link) {
          grid[t.row][t.col].link = t.link;
        }
      }
    });
  }
}

// terrain visual config: fill colors + icon
const TERRAIN_STYLE = {
  server_rack:  { a: COLORS.terrain.serverRackA, b: COLORS.terrain.serverRackB, icon: '\uD83D\uDDA5\uFE0F', iconColor: COLORS.terrain.serverRackIcon },
  overheated:   { a: COLORS.terrain.overheatedA, b: COLORS.terrain.overheatedB, icon: '\uD83D\uDD25', iconColor: COLORS.terrain.overheatedIcon },
  signal_delay: { a: COLORS.terrain.signalDelayA, b: COLORS.terrain.signalDelayB, icon: '\uD83D\uDCF6', iconColor: COLORS.terrain.signalDelayIcon },
  uplink:       { a: COLORS.terrain.uplinkA, b: COLORS.terrain.uplinkB, icon: '\uD83D\uDEF0\uFE0F', iconColor: COLORS.terrain.uplinkIcon },
  quantum:      { a: COLORS.terrain.quantumA, b: COLORS.terrain.quantumB, icon: '\u269B\uFE0F', iconColor: COLORS.terrain.quantumIcon },
  entangled:    { a: COLORS.terrain.entangledA, b: COLORS.terrain.entangledB, icon: '\uD83D\uDD17', iconColor: COLORS.terrain.entangledIcon }
};

function tileColor(cell, r, c) {
  const style = TERRAIN_STYLE[cell.cellType];
  if (cell.cellType === 'water') return (r + c) % 2 === 0 ? COLORS.tileWaterA : COLORS.tileWaterB;
  if (cell.cellType === 'grave') return (r + c) % 2 === 0 ? COLORS.tileGraveA : COLORS.tileGraveB;
  if (style) return (r + c) % 2 === 0 ? style.a : style.b;
  return (r + c) % 2 === 0 ? COLORS.tileGrassA : COLORS.tileGrassB;
}

function draw3dTile(x, y, w, h, color, cell) {
  const depth = Math.min(12, h * 0.12);
  const inset = Math.min(12, w * 0.12);
  const topY = y + 3;
  const topH = h - depth - 4;
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, color);
  grd.addColorStop(1, COLORS.textDark);

  // top face: slightly skewed quadrilateral for isometric depth
  ctx.beginPath();
  ctx.moveTo(x + inset, topY + 4);
  ctx.lineTo(x + w - inset, topY);
  ctx.lineTo(x + w - 4, topY + topH);
  ctx.lineTo(x + 4, topY + topH + 4);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();

  // front bevel
  ctx.beginPath();
  ctx.moveTo(x + 4, topY + topH + 4);
  ctx.lineTo(x + w - 4, topY + topH);
  ctx.lineTo(x + w - 10, y + h - 3);
  ctx.lineTo(x + 10, y + h - 1);
  ctx.closePath();
  ctx.fillStyle = COLORS.tileBevelDark;
  ctx.fill();

  // right bevel
  ctx.beginPath();
  ctx.moveTo(x + w - inset, topY);
  ctx.lineTo(x + w - 4, topY + topH);
  ctx.lineTo(x + w - 10, y + h - 3);
  ctx.lineTo(x + w - inset - 5, topY + depth);
  ctx.closePath();
  ctx.fillStyle = COLORS.tileBevelGlow;
  ctx.fill();

  // neon top edge
  ctx.strokeStyle = cell.cellType === 'water' ? COLORS.tileEdgeWater : COLORS.tileEdgeGrass;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + inset, topY + 4);
  ctx.lineTo(x + w - inset, topY);
  ctx.lineTo(x + w - 4, topY + topH);
  ctx.lineTo(x + 4, topY + topH + 4);
  ctx.closePath();
  ctx.stroke();
}

function drawLawn() {
  const rows = gridRows;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const style = TERRAIN_STYLE[cell.cellType];
      draw3dTile(c * CELL_W, TOP_OFFSET + r * ch, CELL_W, ch, tileColor(cell, r, c), cell);
      // draw corrupted block icon
      if (cell.cellType === 'grave') {
        const gx = c * CELL_W + CELL_W / 2;
        const gy = TOP_OFFSET + r * ch + ch / 2;
        ctx.save();
        ctx.fillStyle = COLORS.red500;
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u26A0', gx, gy);
        ctx.restore();
      } else if (style) {
        // draw terrain icon faintly in the corner
        const gx = c * CELL_W + CELL_W - 14;
        const gy = TOP_OFFSET + r * ch + 14;
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = style.iconColor;
        ctx.fillText(style.icon, gx, gy);
        ctx.restore();
      }
    }
  }
  // outer neon frame
  ctx.strokeStyle = COLORS.tileFrame;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

function pixelToCell(px, py) {
  const rows = gridRows;
  const ch = canvas.height / rows;
  if (px < 0 || px >= canvas.width || py < TOP_OFFSET || py >= canvas.height) return null;
  const col = Math.floor(px / CELL_W);
  const row = Math.floor((py - TOP_OFFSET) / ch);
  if (row < 0 || row >= rows || col < 0 || col >= COLS) return null;
  return { row, col };
}
