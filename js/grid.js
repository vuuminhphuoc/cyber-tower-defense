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
  server_rack:  { a: '#1a1a2e', b: '#20203a', icon: '🖥️', iconColor: '#5af' },
  overheated:   { a: '#2e1a0a', b: '#3a2010', icon: '🔥', iconColor: '#f73' },
  signal_delay: { a: '#1a1030', b: '#221540', icon: '📶', iconColor: '#a7f' },
  uplink:       { a: '#0a2030', b: '#0e2840', icon: '🛰️', iconColor: '#5cf' },
  quantum:      { a: '#1a0a2e', b: '#22103a', icon: '⚛️', iconColor: '#c5f' },
  entangled:    { a: '#0a2e2a', b: '#103a35', icon: '🔗', iconColor: '#5fc' }
};

function tileColor(cell, r, c) {
  const style = TERRAIN_STYLE[cell.cellType];
  if (cell.cellType === 'water') return (r + c) % 2 === 0 ? '#0a2e4a' : '#0c3555';
  if (cell.cellType === 'grave') return (r + c) % 2 === 0 ? '#2a1520' : '#351a28';
  if (style) return (r + c) % 2 === 0 ? style.a : style.b;
  return (r + c) % 2 === 0 ? '#0a1a0a' : '#0e220e';
}

function draw3dTile(x, y, w, h, color, cell) {
  const depth = Math.min(12, h * 0.12);
  const inset = Math.min(12, w * 0.12);
  const topY = y + 3;
  const topH = h - depth - 4;
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, color);
  grd.addColorStop(1, '#020806');

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
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // right bevel
  ctx.beginPath();
  ctx.moveTo(x + w - inset, topY);
  ctx.lineTo(x + w - 4, topY + topH);
  ctx.lineTo(x + w - 10, y + h - 3);
  ctx.lineTo(x + w - inset - 5, topY + depth);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,255,65,0.05)';
  ctx.fill();

  // neon top edge
  ctx.strokeStyle = cell.cellType === 'water' ? 'rgba(0,220,255,0.22)' : 'rgba(0,255,65,0.18)';
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
        ctx.fillStyle = '#ff3333';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', gx, gy);
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
        ctx.fillText(style.icon, gx, gy);
        ctx.restore();
      }
    }
  }
  // outer neon frame
  ctx.strokeStyle = 'rgba(0,255,65,0.25)';
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
