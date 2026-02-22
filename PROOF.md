# Thermo-Logic Generator Correctness Proof

## Goal
Prove: for every possible RNG outcome, every puzzle returned by `makePuzzle(config)` is solvable under the game rules.

## Definitions
- `N = config.size`.
- `solution` is a fully solved Latin square (and also block-valid when `N=9`) produced by `generateSolvedBoard(config)`.
- `puzzle` is `solution` with a masked subset of cells replaced by `0`.
- `E` is the set of empty cells in `puzzle`.
- `trend ∈ {+1, -1}` where `+1` means Rising and `-1` means Falling.
- `rowInitialTrends` and `colInitialTrends` are uniform arrays of `trend` on enabled axes.
- `witnessOrder` is all cells in `E`, sorted by `solution[r][c]` ascending when `trend=+1`, descending when `trend=-1`.

A move is legal if it satisfies row/column uniqueness (and block uniqueness for `N=9`) and thermal trend constraints with pivot behavior.

## Construction (Current `makePuzzle`)
1. Construct `solution` with backtracking.
2. Randomly choose mask positions and produce `puzzle`.
3. Randomly choose global `trend` (`+1` or `-1`).
4. Set enabled row/column trends uniformly to `trend`.
5. Build `witnessOrder` by sorting all empty cells by solution value monotonic with `trend`.
6. Return `(puzzle, rowInitialTrends, colInitialTrends, witnessOrder, solution)`.

## Lemma 1: Latin/Block legality of witness placements
Each witness placement writes the value `solution[r][c]` into empty cell `(r,c)`.

Because `solution` is valid:
- no duplicate exists in any row/column,
- and when `N=9`, no duplicate exists in any 3x3 block.

Given cells already match `solution`, writing remaining cells in any order cannot create duplicate conflicts. Therefore every witness step is row/column legal (and block legal in `N=9`).

## Lemma 2: Thermal legality of witness placements
Consider any enabled row `r`. Let `S_r` be witness values written in row `r` in witness order.

By construction:
- if `trend=+1`, global witness order is nondecreasing by value, and row values are unique, so `S_r` is strictly increasing.
- if `trend=-1`, global witness order is nonincreasing by value, and row values are unique, so `S_r` is strictly decreasing.

The same holds for every enabled column.

Thermal rule requires each next placed value in a line to be greater (Rising) or smaller (Falling) than the previous one. Strictly monotone line sequences satisfy this directly.

Pivot rule:
- in Rising mode, placing `N` flips to Falling;
- in Falling mode, placing `1` flips to Rising.

In a strictly increasing sequence, `N` can appear only as the last value for that line, so post-flip there is no later value to violate constraints.
In a strictly decreasing sequence, `1` can appear only as the last value for that line, so post-flip there is no later value to violate constraints.

Therefore every witness step is thermal-legal.

## Theorem: Solvability for all RNG outcomes
RNG affects only:
- candidate ordering in solved-board generation,
- which cells are masked,
- tie-break order among equal-valued witness cells,
- choice of global trend sign.

For every resulting RNG path, `makePuzzle` returns a witness sequence that is legal at every step by Lemma 1 and Lemma 2, and completes the board to `solution`.

Hence every generated puzzle is solvable.

## Scope
This proves **existence of at least one valid completion path** for each generated puzzle. It does not claim uniqueness of solution.
