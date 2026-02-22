const assert = require("node:assert/strict");

function makeMockElement() {
  return {
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    querySelectorAll() {
      return [];
    },
    classList: {
      add() {},
      remove() {}
    },
    style: {
      setProperty() {}
    },
    innerHTML: "",
    textContent: "",
    disabled: false,
    clientWidth: 420
  };
}

global.window = {
  addEventListener() {},
  matchMedia() {
    return { matches: false };
  }
};

global.document = {
  getElementById() {
    return makeMockElement();
  },
  querySelectorAll() {
    return [];
  },
  createElement() {
    return makeMockElement();
  }
};

const {
  DIFFICULTIES,
  makePuzzle,
  computeLineStates
} = require("../app.js");

const RUNS = {
  stable: 80,
  critical: 60,
  meltdown: 40,
  supernova: 20
};

function testDifficulty(key, config, runs) {
  const start = Date.now();
  for (let i = 0; i < runs; i += 1) {
    const result = makePuzzle(config);

    const emptyCells = result.puzzle.flat().filter((n) => n === 0).length;
    assert.ok(emptyCells > 0, `${key}: expected masked cells`);

    const lineStates = computeLineStates(
      result.puzzle,
      result.givenMask,
      [],
      result.rowInitialTrends,
      result.colInitialTrends,
      config
    );

    const emptyCellsFromMask = result.givenMask.flat().filter((isGiven) => !isGiven).length;
    assert.equal(
      result.witnessOrder.length,
      emptyCellsFromMask,
      `${key}: witness order length mismatch on run ${i + 1}`
    );

    const board = result.puzzle.map((row) => row.slice());
    const size = config.size;
    const rowUsed = Array.from({ length: size }, () => new Set());
    const colUsed = Array.from({ length: size }, () => new Set());
    const blockUsed = config.useBlocks ? Array.from({ length: size }, () => new Set()) : [];
    const rowState = lineStates.rowStates.map((s) => ({ ...s }));
    const colState = lineStates.colStates.map((s) => ({ ...s }));

    function blockIndex(r, c) {
      const b = 3;
      return Math.floor(r / b) * b + Math.floor(c / b);
    }

    function assertThermal(line, value, enabled, label) {
      if (!enabled || line.last == null) return;
      if (line.trend === 1) {
        assert.ok(value > line.last, `${key}: ${label} expected rising trend`);
      } else {
        assert.ok(value < line.last, `${key}: ${label} expected falling trend`);
      }
    }

    function applyPivot(line, value) {
      line.last = value;
      if (line.trend === 1 && value === size) line.trend = -1;
      else if (line.trend === -1 && value === 1) line.trend = 1;
    }

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const v = board[r][c];
        if (!v) continue;
        assert.ok(!rowUsed[r].has(v), `${key}: duplicate given in row`);
        assert.ok(!colUsed[c].has(v), `${key}: duplicate given in col`);
        rowUsed[r].add(v);
        colUsed[c].add(v);
        if (config.useBlocks) {
          const bi = blockIndex(r, c);
          assert.ok(!blockUsed[bi].has(v), `${key}: duplicate given in block`);
          blockUsed[bi].add(v);
        }
      }
    }

    for (const step of result.witnessOrder) {
      const { r, c } = step;
      assert.equal(board[r][c], 0, `${key}: witness writes non-empty cell`);
      const value = result.solution[r][c];
      assert.ok(!rowUsed[r].has(value), `${key}: witness row clash`);
      assert.ok(!colUsed[c].has(value), `${key}: witness col clash`);
      if (config.useBlocks) {
        const bi = blockIndex(r, c);
        assert.ok(!blockUsed[bi].has(value), `${key}: witness block clash`);
      }

      assertThermal(rowState[r], value, config.rowTrends, "row");
      assertThermal(colState[c], value, config.colTrends, "col");

      board[r][c] = value;
      rowUsed[r].add(value);
      colUsed[c].add(value);
      if (config.useBlocks) blockUsed[blockIndex(r, c)].add(value);
      applyPivot(rowState[r], value);
      applyPivot(colState[c], value);
    }

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        assert.equal(board[r][c], result.solution[r][c], `${key}: witness does not complete solution`);
      }
    }
  }
  const durationMs = Date.now() - start;
  return { runs, durationMs };
}

(function run() {
  const summary = {};
  for (const [key, config] of Object.entries(DIFFICULTIES)) {
    summary[key] = testDifficulty(key, config, RUNS[key]);
  }

  console.log("Solvability Monte Carlo passed:");
  for (const [key, info] of Object.entries(summary)) {
    console.log(`- ${key}: ${info.runs} puzzles in ${(info.durationMs / 1000).toFixed(2)}s`);
  }
})();
