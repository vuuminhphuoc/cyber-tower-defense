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
}

function drawLawn() {
  const rows = gridRows;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell.cellType === 'water') {
        // data stream — cyan/blue glow
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0a2e4a' : '#0c3555';
      } else if (cell.cellType === 'grave') {
        // corrupted block — red tint
        ctx.fillStyle = (r + c) % 2 === 0 ? '#2a1520' : '#351a28';
      } else {
        // terminal grid — dark green/black
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0a1a0a' : '#0e220e';
      }
      ctx.fillRect(c * CELL_W, TOP_OFFSET + r * ch, CELL_W, ch);
      // draw corrupted block icon
      if (cell.cellType === 'grave') {
        const gx = c * CELL_W + CELL_W / 2;
        const gy = TOP_OFFSET + r * ch + ch / 2;
        ctx.save();
        ctx.fillStyle = '#ff3333';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', gx, gy);
        ctx.restore();
      }
    }
  }
  // grid lines — neon green
  ctx.strokeStyle = 'rgba(0,255,65,0.15)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_W, 0);
    ctx.lineTo(c * CELL_W, canvas.height);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, TOP_OFFSET + r * ch);
    ctx.lineTo(canvas.width, TOP_OFFSET + r * ch);
    ctx.stroke();
  }
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
