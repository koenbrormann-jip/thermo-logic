const DIFFICULTIES = {
  stable: { label: "Stable", size: 4, rowTrends: true, colTrends: false, maskRatio: 0.6, useBlocks: false },
  critical: { label: "Critical", size: 5, rowTrends: true, colTrends: true, maskRatio: 0.6, useBlocks: false },
  meltdown: { label: "Meltdown", size: 6, rowTrends: true, colTrends: true, maskRatio: 0.72, useBlocks: false },
  supernova: { label: "Supernova", size: 9, rowTrends: true, colTrends: true, maskRatio: 0.65, useBlocks: true }
};

const appState = {
  config: null,
  size: 0,
  solution: [],
  grid: [],
  givenMask: [],
  userOrder: [],
  selected: null,
  rowInitialTrends: [],
  colInitialTrends: [],
  witnessOrder: [],
  lineStates: null,
  lastInvalid: null,
  gameStartMs: 0,
  timerId: null,
  solved: false
};

const ui = {
  landing: document.getElementById("landing"),
  game: document.getElementById("game"),
  difficultyLabel: document.getElementById("difficultyLabel"),
  gridWrap: document.getElementById("gridWrap"),
  statusText: document.getElementById("statusText"),
  timerValue: document.getElementById("timerValue"),
  resetRowBtn: document.getElementById("resetRowBtn"),
  resetColBtn: document.getElementById("resetColBtn"),
  restartBtn: document.getElementById("restartBtn"),
  backBtn: document.getElementById("backBtn"),
  mobilePad: document.getElementById("mobilePad"),
  numpadKeys: document.getElementById("numpadKeys"),
  winPanel: document.getElementById("winPanel"),
  winTime: document.getElementById("winTime"),
  playAgainBtn: document.getElementById("playAgainBtn")
};

async function cleanupLegacyOfflineCache() {
  if (typeof window === "undefined") return;

  if (typeof navigator !== "undefined" && navigator.serviceWorker?.getRegistrations) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if (window.caches?.keys) {
    const keys = await window.caches.keys();
    const staleKeys = keys.filter((key) => key.startsWith("workout-coach"));
    await Promise.all(staleKeys.map((key) => window.caches.delete(key)));
  }
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function shuffledRange(min, max) {
  const arr = [];
  for (let i = min; i <= max; i += 1) arr.push(i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const sec = String(totalSec % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function initializeGrid(size, value = 0) {
  return Array.from({ length: size }, () => Array(size).fill(value));
}

function initializeBoolGrid(size, value = false) {
  return Array.from({ length: size }, () => Array(size).fill(value));
}

function blockSizeFor(size) {
  return size === 9 ? 3 : 0;
}

function computeCellSizePx(size) {
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  const wrapWidth = Math.max(280, ui.gridWrap.clientWidth || window.innerWidth - 32);
  const totalCells = size + 1;
  const totalGaps = (totalCells - 1) * 2;
  const rough = Math.floor((wrapWidth - totalGaps - 8) / totalCells);
  const minPx = mobile ? 30 : 38;
  const maxPx = mobile ? 52 : 60;
  return Math.max(minPx, Math.min(maxPx, rough));
}

function generateSolvedBoard(config) {
  const size = config.size;
  const grid = initializeGrid(size, 0);
  const rowUsed = Array.from({ length: size }, () => new Set());
  const colUsed = Array.from({ length: size }, () => new Set());
  const blockUsed = config.useBlocks ? Array.from({ length: size }, () => new Set()) : [];

  function blockIndex(r, c) {
    const b = blockSizeFor(size);
    return Math.floor(r / b) * b + Math.floor(c / b);
  }

  function candidates(r, c) {
    const list = shuffledRange(1, size);
    return list.filter((n) => {
      if (rowUsed[r].has(n) || colUsed[c].has(n)) return false;
      if (config.useBlocks && blockUsed[blockIndex(r, c)].has(n)) return false;
      return true;
    });
  }

  function pickNextCell() {
    let best = null;
    let bestCount = Infinity;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const count = candidates(r, c).length;
        if (count < bestCount) {
          bestCount = count;
          best = { r, c };
          if (count === 1) return best;
        }
      }
    }
    return best;
  }

  function dfs() {
    const cell = pickNextCell();
    if (!cell) return true;

    const opts = candidates(cell.r, cell.c);
    if (!opts.length) return false;

    for (const n of opts) {
      grid[cell.r][cell.c] = n;
      rowUsed[cell.r].add(n);
      colUsed[cell.c].add(n);
      let bIdx = -1;
      if (config.useBlocks) {
        bIdx = blockIndex(cell.r, cell.c);
        blockUsed[bIdx].add(n);
      }

      if (dfs()) return true;

      grid[cell.r][cell.c] = 0;
      rowUsed[cell.r].delete(n);
      colUsed[cell.c].delete(n);
      if (config.useBlocks) blockUsed[bIdx].delete(n);
    }

    return false;
  }

  const solved = dfs();
  if (!solved) throw new Error("Failed to generate solved board");
  return grid;
}

function buildUniformTrends(size, applies, trend) {
  if (!applies) return Array(size).fill(1);
  return Array(size).fill(trend);
}

function buildWitnessOrder(solution, givenMask, trend) {
  const empties = [];
  for (let r = 0; r < solution.length; r += 1) {
    for (let c = 0; c < solution.length; c += 1) {
      if (!givenMask[r][c]) empties.push({ r, c });
    }
  }

  // Tie-breaker randomizes equal-valued cells while preserving global monotonicity.
  return empties.sort((a, b) => {
    const av = solution[a.r][a.c];
    const bv = solution[b.r][b.c];
    if (av !== bv) return trend === 1 ? av - bv : bv - av;
    return Math.random() < 0.5 ? -1 : 1;
  });
}

function getLineStateFromOrder(values, initialTrend, maxVal) {
  let trend = initialTrend;
  let last = null;
  for (const value of values) {
    last = value;
    if (trend === 1 && value === maxVal) {
      trend = -1;
    } else if (trend === -1 && value === 1) {
      trend = 1;
    }
  }
  return { trend, last };
}

function computeLineStates(grid, givenMask, userOrder, rowInitialTrends, colInitialTrends, config) {
  const size = config.size;
  const rowEvents = Array.from({ length: size }, () => []);
  const colEvents = Array.from({ length: size }, () => []);

  const byCell = new Map();
  for (const event of userOrder) {
    byCell.set(`${event.r},${event.c}`, event);
  }

  byCell.forEach((event) => {
    const value = grid[event.r][event.c];
    if (!value || givenMask[event.r][event.c]) return;
    rowEvents[event.r].push({ order: event.order, value });
    colEvents[event.c].push({ order: event.order, value });
  });

  const rowStates = rowEvents.map((events, i) => {
    events.sort((a, b) => a.order - b.order);
    const seq = events.map((e) => e.value);
    return getLineStateFromOrder(seq, rowInitialTrends[i], size);
  });

  const colStates = colEvents.map((events, i) => {
    events.sort((a, b) => a.order - b.order);
    const seq = events.map((e) => e.value);
    return getLineStateFromOrder(seq, colInitialTrends[i], size);
  });

  return { rowStates, colStates };
}

function hasDuplicateInLine(grid, r, c, value) {
  for (let i = 0; i < appState.size; i += 1) {
    if (i !== c && grid[r][i] === value) return true;
    if (i !== r && grid[i][c] === value) return true;
  }
  return false;
}

function violatesBlock(grid, r, c, value) {
  if (!appState.config.useBlocks) return false;
  const b = blockSizeFor(appState.size);
  const sr = Math.floor(r / b) * b;
  const sc = Math.floor(c / b) * b;
  for (let rr = sr; rr < sr + b; rr += 1) {
    for (let cc = sc; cc < sc + b; cc += 1) {
      if ((rr !== r || cc !== c) && grid[rr][cc] === value) return true;
    }
  }
  return false;
}

function thermalLegalForLine(state, value, enabled) {
  if (!enabled) return true;
  if (state.last == null) return true;
  if (state.trend === 1) return value > state.last;
  return value < state.last;
}

function checkMoveLegality(r, c, value, board, lineStates) {
  if (value < 1 || value > appState.size) return { legal: false, reason: "Value out of range." };
  if (hasDuplicateInLine(board, r, c, value)) {
    return { legal: false, reason: "Sudoku/Latin rule violated in row or column." };
  }
  if (violatesBlock(board, r, c, value)) {
    return { legal: false, reason: "Supernova block rule violated." };
  }

  const rowOk = thermalLegalForLine(lineStates.rowStates[r], value, appState.config.rowTrends);
  if (!rowOk) return { legal: false, reason: "Row thermal trend violated." };

  const colOk = thermalLegalForLine(lineStates.colStates[c], value, appState.config.colTrends);
  if (!colOk) return { legal: false, reason: "Column thermal trend violated." };

  return { legal: true, reason: "Move legal." };
}

function updateLineStateWithPlacement(state, value, maxVal) {
  const prev = { trend: state.trend, last: state.last };
  state.last = value;
  if (state.trend === 1 && value === maxVal) state.trend = -1;
  else if (state.trend === -1 && value === 1) state.trend = 1;
  return prev;
}

function deepCopyLineStates(lineStates) {
  return {
    rowStates: lineStates.rowStates.map((x) => ({ trend: x.trend, last: x.last })),
    colStates: lineStates.colStates.map((x) => ({ trend: x.trend, last: x.last }))
  };
}

function isSolvableAfterMove(grid, lineStates, config) {
  const size = config.size;
  const rowUsed = Array.from({ length: size }, () => new Set());
  const colUsed = Array.from({ length: size }, () => new Set());
  const blockUsed = config.useBlocks ? Array.from({ length: size }, () => new Set()) : [];

  function blockIndex(r, c) {
    const b = blockSizeFor(size);
    return Math.floor(r / b) * b + Math.floor(c / b);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const val = grid[r][c];
      if (!val) continue;
      if (rowUsed[r].has(val) || colUsed[c].has(val)) return false;
      rowUsed[r].add(val);
      colUsed[c].add(val);
      if (config.useBlocks) {
        const bi = blockIndex(r, c);
        if (blockUsed[bi].has(val)) return false;
        blockUsed[bi].add(val);
      }
    }
  }

  const rows = lineStates.rowStates.map((s) => ({ trend: s.trend, last: s.last }));
  const cols = lineStates.colStates.map((s) => ({ trend: s.trend, last: s.last }));

  function candidateValues(r, c) {
    const values = [];
    for (let n = 1; n <= size; n += 1) {
      if (rowUsed[r].has(n) || colUsed[c].has(n)) continue;
      if (config.useBlocks && blockUsed[blockIndex(r, c)].has(n)) continue;
      if (!thermalLegalForLine(rows[r], n, config.rowTrends)) continue;
      if (!thermalLegalForLine(cols[c], n, config.colTrends)) continue;
      values.push(n);
    }
    return values;
  }

  function pickCell() {
    let best = null;
    let bestOpts = null;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const opts = candidateValues(r, c);
        if (!opts.length) return { r, c, opts };
        if (!best || opts.length < bestOpts.length) {
          best = { r, c, opts };
          bestOpts = opts;
          if (opts.length === 1) return best;
        }
      }
    }
    return best;
  }

  function solve(limit = 2_000_000) {
    if (limit <= 0) return false;
    const cell = pickCell();
    if (!cell) return true;
    if (!cell.opts.length) return false;

    const opts = cell.opts.slice();
    for (let i = opts.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    for (const n of opts) {
      grid[cell.r][cell.c] = n;
      rowUsed[cell.r].add(n);
      colUsed[cell.c].add(n);
      let bIdx = -1;
      if (config.useBlocks) {
        bIdx = blockIndex(cell.r, cell.c);
        blockUsed[bIdx].add(n);
      }

      const prevRow = updateLineStateWithPlacement(rows[cell.r], n, size);
      const prevCol = updateLineStateWithPlacement(cols[cell.c], n, size);

      if (solve(limit - 1)) return true;

      rows[cell.r].trend = prevRow.trend;
      rows[cell.r].last = prevRow.last;
      cols[cell.c].trend = prevCol.trend;
      cols[cell.c].last = prevCol.last;
      grid[cell.r][cell.c] = 0;
      rowUsed[cell.r].delete(n);
      colUsed[cell.c].delete(n);
      if (config.useBlocks) blockUsed[bIdx].delete(n);
    }
    return false;
  }

  return solve();
}

function makePuzzle(config) {
  const size = config.size;
  const solution = generateSolvedBoard(config);
  const puzzle = solution.map((row) => row.slice());
  const givenMask = initializeBoolGrid(size, true);

  const allCells = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) allCells.push({ r, c });
  }
  for (let i = allCells.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }

  const toRemove = Math.floor(size * size * config.maskRatio);
  for (let i = 0; i < toRemove; i += 1) {
    const { r, c } = allCells[i];
    puzzle[r][c] = 0;
    givenMask[r][c] = false;
  }

  const trend = Math.random() < 0.5 ? 1 : -1;
  const rowInitialTrends = buildUniformTrends(size, config.rowTrends, trend);
  const colInitialTrends = buildUniformTrends(size, config.colTrends, trend);
  const witnessOrder = buildWitnessOrder(solution, givenMask, trend);

  return { solution, puzzle, givenMask, rowInitialTrends, colInitialTrends, witnessOrder };
}

function startGame(difficultyKey) {
  const config = DIFFICULTIES[difficultyKey];
  if (!config) return;

  const puzzle = makePuzzle(config);

  appState.config = config;
  appState.size = config.size;
  appState.solution = puzzle.solution;
  appState.grid = puzzle.puzzle;
  appState.givenMask = puzzle.givenMask;
  appState.userOrder = [];
  appState.rowInitialTrends = puzzle.rowInitialTrends;
  appState.colInitialTrends = puzzle.colInitialTrends;
  appState.witnessOrder = puzzle.witnessOrder || [];
  appState.selected = null;
  appState.lastInvalid = null;
  appState.solved = false;

  appState.lineStates = computeLineStates(
    appState.grid,
    appState.givenMask,
    appState.userOrder,
    appState.rowInitialTrends,
    appState.colInitialTrends,
    appState.config
  );

  ui.landing.classList.add("hidden");
  ui.game.classList.remove("hidden");
  ui.winPanel.classList.add("hidden");
  ui.winPanel.classList.remove("flex");
  ui.difficultyLabel.textContent = `${config.label} • ${config.size}x${config.size}`;
  ui.statusText.textContent = "Select a cell and enter a number.";

  appState.gameStartMs = Date.now();
  if (appState.timerId) clearInterval(appState.timerId);
  appState.timerId = setInterval(() => {
    ui.timerValue.textContent = formatTime(Date.now() - appState.gameStartMs);
  }, 1000);
  ui.timerValue.textContent = "00:00";

  renderNumpad();
  renderGrid();
}

function arrowChar(trend) {
  return trend === 1 ? "↑" : "↓";
}

function createArrowCell(type, index, trend) {
  const el = document.createElement("div");
  el.className = `arrow-cell ${trend === 1 ? "rising" : "falling"}`;
  el.dataset.arrowType = type;
  el.dataset.arrowIndex = String(index);
  el.textContent = arrowChar(trend);
  return el;
}

function renderGrid() {
  const size = appState.size;
  const board = document.createElement("div");
  board.className = "grid-board";
  const cellPx = computeCellSizePx(size);
  board.style.setProperty("--cell-size", `${cellPx}px`);
  board.style.gridTemplateColumns = `repeat(${size + 1}, var(--cell-size))`;

  const corner = document.createElement("div");
  corner.className = "corner-cell";
  board.appendChild(corner);

  for (let c = 0; c < size; c += 1) {
    const trend = appState.config.colTrends ? appState.lineStates.colStates[c].trend : 1;
    const arrow = createArrowCell("col", c, trend);
    if (!appState.config.colTrends) {
      arrow.textContent = "·";
      arrow.classList.remove("rising", "falling");
    }
    board.appendChild(arrow);
  }

  for (let r = 0; r < size; r += 1) {
    const rowTrend = appState.config.rowTrends ? appState.lineStates.rowStates[r].trend : 1;
    const rowArrow = createArrowCell("row", r, rowTrend);
    if (!appState.config.rowTrends) {
      rowArrow.textContent = "·";
      rowArrow.classList.remove("rising", "falling");
    }
    board.appendChild(rowArrow);

    for (let c = 0; c < size; c += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid-cell";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const val = appState.grid[r][c];
      cell.textContent = val ? String(val) : "";
      if (appState.givenMask[r][c]) cell.classList.add("given");

      if (appState.selected && appState.selected.r === r && appState.selected.c === c) {
        cell.classList.add("selected");
      }

      if (appState.selected && (appState.selected.r === r || appState.selected.c === c)) {
        cell.classList.add("highlight");
      }

      if (appState.lastInvalid && appState.lastInvalid.r === r && appState.lastInvalid.c === c) {
        cell.classList.add("invalid");
      }

      if (appState.config.useBlocks) {
        const b = blockSizeFor(size);
        if ((c + 1) % b === 0 && c < size - 1) cell.classList.add("block-right");
        if ((r + 1) % b === 0 && r < size - 1) cell.classList.add("block-bottom");
      }

      cell.addEventListener("click", () => selectCell(r, c));
      board.appendChild(cell);
    }
  }

  ui.gridWrap.innerHTML = "";
  ui.gridWrap.appendChild(board);
  syncResetButtons();
  syncNumpadButtons();
}

function selectCell(r, c) {
  appState.selected = { r, c };
  appState.lastInvalid = null;
  const cellType = appState.givenMask[r][c] ? "sealed hint cell" : "editable cell";
  ui.statusText.textContent = `Selected R${r + 1} C${c + 1} (${cellType}).`;
  renderGrid();
}

function moveSelection(dr, dc) {
  if (!appState.selected || !appState.config) return;
  const nextR = Math.max(0, Math.min(appState.size - 1, appState.selected.r + dr));
  const nextC = Math.max(0, Math.min(appState.size - 1, appState.selected.c + dc));
  if (nextR === appState.selected.r && nextC === appState.selected.c) return;
  selectCell(nextR, nextC);
}

function getNextOrder() {
  if (!appState.userOrder.length) return 1;
  return Math.max(...appState.userOrder.map((x) => x.order)) + 1;
}

function setCellValue(r, c, value) {
  appState.grid[r][c] = value;
  appState.userOrder = appState.userOrder.filter((e) => !(e.r === r && e.c === c));
  if (value > 0) appState.userOrder.push({ r, c, order: getNextOrder() });

  appState.lineStates = computeLineStates(
    appState.grid,
    appState.givenMask,
    appState.userOrder,
    appState.rowInitialTrends,
    appState.colInitialTrends,
    appState.config
  );
}

function updateArrowIfFlipped(type, index, prevTrend, nextTrend) {
  if (prevTrend === nextTrend) return;
  const selector = `.arrow-cell[data-arrow-type="${type}"][data-arrow-index="${index}"]`;
  const el = ui.gridWrap.querySelector(selector);
  if (!el) return;
  el.classList.remove("rising", "falling", "flip");
  el.classList.add(nextTrend === 1 ? "rising" : "falling");
  el.textContent = arrowChar(nextTrend);
  void el.offsetWidth;
  el.classList.add("flip");
}

function tryPlaceSelected(value) {
  if (!appState.selected || appState.solved) return;
  const { r, c } = appState.selected;
  if (appState.givenMask[r][c]) {
    ui.statusText.textContent = "Cannot edit a pre-filled hint cell.";
    return;
  }

  if (value === 0) {
    setCellValue(r, c, 0);
    appState.lastInvalid = null;
    ui.statusText.textContent = `Cleared R${r + 1} C${c + 1}.`;
    renderGrid();
    return;
  }

  const orderBefore = appState.userOrder.filter((e) => !(e.r === r && e.c === c));
  const boardBase = appState.grid.map((row) => row.slice());
  boardBase[r][c] = 0;
  const boardCopy = boardBase.map((row) => row.slice());
  boardCopy[r][c] = value;
  const lineStatesBefore = computeLineStates(
    boardBase,
    appState.givenMask,
    orderBefore,
    appState.rowInitialTrends,
    appState.colInitialTrends,
    appState.config
  );

  const legal = checkMoveLegality(r, c, value, boardCopy, lineStatesBefore);
  if (!legal.legal) {
    appState.lastInvalid = { r, c };
    ui.statusText.textContent = legal.reason;
    renderGrid();
    return;
  }

  setCellValue(r, c, value);

  appState.lastInvalid = null;
  ui.statusText.textContent = `Placed ${value} at R${r + 1} C${c + 1}.`;
  renderGrid();

  if (appState.config.rowTrends) {
    updateArrowIfFlipped(
      "row",
      r,
      lineStatesBefore.rowStates[r].trend,
      appState.lineStates.rowStates[r].trend
    );
  }
  if (appState.config.colTrends) {
    updateArrowIfFlipped(
      "col",
      c,
      lineStatesBefore.colStates[c].trend,
      appState.lineStates.colStates[c].trend
    );
  }

  checkWin();
}

function isBoardCompleteAndValid() {
  const size = appState.size;

  for (let r = 0; r < size; r += 1) {
    const set = new Set(appState.grid[r]);
    if (set.has(0) || set.size !== size) return false;
  }

  for (let c = 0; c < size; c += 1) {
    const set = new Set();
    for (let r = 0; r < size; r += 1) set.add(appState.grid[r][c]);
    if (set.has(0) || set.size !== size) return false;
  }

  if (appState.config.useBlocks) {
    const b = blockSizeFor(size);
    for (let sr = 0; sr < size; sr += b) {
      for (let sc = 0; sc < size; sc += b) {
        const set = new Set();
        for (let r = sr; r < sr + b; r += 1) {
          for (let c = sc; c < sc + b; c += 1) {
            set.add(appState.grid[r][c]);
          }
        }
        if (set.size !== size) return false;
      }
    }
  }

  return true;
}

function checkWin() {
  if (appState.solved) return;
  if (!isBoardCompleteAndValid()) return;

  appState.solved = true;
  clearInterval(appState.timerId);
  appState.timerId = null;

  const elapsed = Date.now() - appState.gameStartMs;
  ui.winTime.textContent = `Stabilization time: ${formatTime(elapsed)}`;
  syncNumpadButtons();
  ui.winPanel.classList.remove("hidden");
  ui.winPanel.classList.add("flex");
}

function clearSelectedRow() {
  if (!appState.selected || appState.solved) return;
  const r = appState.selected.r;
  for (let c = 0; c < appState.size; c += 1) {
    if (!appState.givenMask[r][c]) setCellValue(r, c, 0);
  }
  appState.lastInvalid = null;
  ui.statusText.textContent = `Row ${r + 1} reset.`;
  renderGrid();
}

function clearSelectedCol() {
  if (!appState.selected || appState.solved) return;
  const c = appState.selected.c;
  for (let r = 0; r < appState.size; r += 1) {
    if (!appState.givenMask[r][c]) setCellValue(r, c, 0);
  }
  appState.lastInvalid = null;
  ui.statusText.textContent = `Column ${c + 1} reset.`;
  renderGrid();
}

function syncResetButtons() {
  const enabled = Boolean(appState.selected) && !appState.solved;
  ui.resetRowBtn.disabled = !enabled;
  ui.resetColBtn.disabled = !enabled;
}

function syncNumpadButtons() {
  if (!ui.numpadKeys) return;
  const hasSelection = Boolean(appState.selected);
  const editableSelection = hasSelection
    && !appState.givenMask[appState.selected.r][appState.selected.c]
    && !appState.solved;
  ui.numpadKeys.querySelectorAll(".numpad-btn").forEach((btn) => {
    btn.disabled = !editableSelection;
  });
}

function renderNumpad() {
  if (!ui.mobilePad || !ui.numpadKeys) return;
  if (!appState.config) {
    ui.mobilePad.classList.add("hidden");
    ui.numpadKeys.innerHTML = "";
    return;
  }

  const size = appState.size;
  ui.numpadKeys.innerHTML = "";
  for (let n = 1; n <= size; n += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "numpad-btn";
    btn.textContent = String(n);
    btn.addEventListener("click", () => tryPlaceSelected(n));
    ui.numpadKeys.appendChild(btn);
  }

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "numpad-btn clear";
  clearBtn.textContent = "Clear";
  clearBtn.addEventListener("click", () => tryPlaceSelected(0));
  ui.numpadKeys.appendChild(clearBtn);

  ui.mobilePad.classList.remove("hidden");
  syncNumpadButtons();
}

function wireEvents() {
  document.querySelectorAll(".difficulty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      startGame(btn.dataset.difficulty);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (!appState.config || appState.solved) return;

    const key = event.key;
    if (/^[1-9]$/.test(key)) {
      const val = Number(key);
      if (val <= appState.size) {
        event.preventDefault();
        tryPlaceSelected(val);
      }
    } else if (key === "Backspace" || key === "Delete" || key === "0") {
      event.preventDefault();
      tryPlaceSelected(0);
    } else if (key === "ArrowUp" && appState.selected) {
      event.preventDefault();
      moveSelection(-1, 0);
    } else if (key === "ArrowDown" && appState.selected) {
      event.preventDefault();
      moveSelection(1, 0);
    } else if (key === "ArrowLeft" && appState.selected) {
      event.preventDefault();
      moveSelection(0, -1);
    } else if (key === "ArrowRight" && appState.selected) {
      event.preventDefault();
      moveSelection(0, 1);
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchMoved = false;

  ui.gridWrap.addEventListener("touchstart", (event) => {
    if (!appState.config || appState.solved || !event.touches.length) return;
    const t = event.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    touchMoved = false;
  }, { passive: true });

  ui.gridWrap.addEventListener("touchmove", (event) => {
    if (!appState.config || !event.touches.length) return;
    const t = event.touches[0];
    if (Math.abs(t.clientX - touchStartX) > 8 || Math.abs(t.clientY - touchStartY) > 8) {
      touchMoved = true;
    }
  }, { passive: true });

  ui.gridWrap.addEventListener("touchend", (event) => {
    if (!appState.config || appState.solved || !appState.selected) return;
    if (!touchMoved || !event.changedTouches.length) return;

    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const minDistance = 24;
    const maxDuration = 650;

    if (dt > maxDuration) return;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveSelection(0, dx > 0 ? 1 : -1);
    } else {
      moveSelection(dy > 0 ? 1 : -1, 0);
    }
  }, { passive: true });

  ui.resetRowBtn.addEventListener("click", clearSelectedRow);
  ui.resetColBtn.addEventListener("click", clearSelectedCol);

  ui.restartBtn.addEventListener("click", () => {
    if (!appState.config) return;
    startGame(Object.keys(DIFFICULTIES).find((k) => DIFFICULTIES[k] === appState.config));
  });

  ui.backBtn.addEventListener("click", () => {
    if (appState.timerId) clearInterval(appState.timerId);
    appState.timerId = null;
    appState.config = null;
    appState.selected = null;
    appState.solved = false;
    ui.game.classList.add("hidden");
    ui.winPanel.classList.add("hidden");
    ui.winPanel.classList.remove("flex");
    ui.landing.classList.remove("hidden");
    if (ui.mobilePad) ui.mobilePad.classList.add("hidden");
  });

  ui.playAgainBtn.addEventListener("click", () => {
    if (!appState.config) return;
    startGame(Object.keys(DIFFICULTIES).find((k) => DIFFICULTIES[k] === appState.config));
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (!appState.config) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderGrid();
    }, 100);
  });
}

cleanupLegacyOfflineCache().finally(() => {
  wireEvents();
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DIFFICULTIES,
    makePuzzle,
    computeLineStates,
    isSolvableAfterMove
  };
}
