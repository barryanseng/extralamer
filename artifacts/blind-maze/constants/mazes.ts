export type Cell = {
  row: number;
  col: number;
};

export type MazeData = {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  rows: number;
  cols: number;
  start: Cell;
  exit: Cell;
  walls: WallSet;
  minMoves: number;
};

export type WallSet = {
  horizontal: boolean[][];
  vertical: boolean[][];
};

function makeWalls(rows: number, cols: number): WallSet {
  const horizontal = Array.from({ length: rows + 1 }, () =>
    Array(cols).fill(false)
  );
  const vertical = Array.from({ length: rows }, () =>
    Array(cols + 1).fill(false)
  );
  const addHWall = (r: number, c: number) => { horizontal[r][c] = true; };
  const addVWall = (r: number, c: number) => { vertical[r][c] = true; };
  return { horizontal, vertical, addHWall, addVWall } as any;
}

function buildMaze(
  id: string,
  name: string,
  difficulty: "easy" | "medium" | "hard",
  rows: number,
  cols: number,
  start: Cell,
  exit: Cell,
  minMoves: number,
  wallSpec: (addH: (r: number, c: number) => void, addV: (r: number, c: number) => void) => void
): MazeData {
  const walls = makeWalls(rows, cols);
  const addH = (r: number, c: number) => { walls.horizontal[r][c] = true; };
  const addV = (r: number, c: number) => { walls.vertical[r][c] = true; };

  for (let c = 0; c < cols; c++) {
    addH(0, c);
    addH(rows, c);
  }
  for (let r = 0; r < rows; r++) {
    addV(r, 0);
    addV(r, cols);
  }

  wallSpec(addH, addV);

  return { id, name, difficulty, rows, cols, start, exit, walls, minMoves };
}

export const MAZES: MazeData[] = [
  buildMaze("easy1", "The Hallway", "easy", 3, 3, { row: 0, col: 0 }, { row: 2, col: 2 }, 4, (H, V) => {
    H(1, 0); H(1, 1);
    V(0, 1); V(0, 2);
    V(1, 2);
    V(2, 1);
  }),

  buildMaze("easy2", "The Corner", "easy", 3, 4, { row: 0, col: 0 }, { row: 0, col: 3 }, 5, (H, V) => {
    H(1, 0); H(1, 1); H(1, 2);
    H(2, 1); H(2, 2); H(2, 3);
    V(0, 1); V(0, 2);
    V(1, 3);
    V(2, 2);
  }),

  buildMaze("easy3", "The L Shape", "easy", 4, 3, { row: 0, col: 0 }, { row: 3, col: 2 }, 5, (H, V) => {
    H(1, 1); H(1, 2);
    H(2, 0); H(2, 1);
    H(3, 0);
    V(0, 1); V(0, 2);
    V(1, 2);
    V(2, 1); V(2, 2);
  }),

  buildMaze("easy4", "The Bridge", "easy", 3, 5, { row: 1, col: 0 }, { row: 1, col: 4 }, 6, (H, V) => {
    H(0, 0); H(0, 1); H(0, 2); H(0, 3); H(0, 4);
    H(1, 1); H(1, 3);
    H(2, 0); H(2, 2); H(2, 4);
    V(0, 1); V(0, 3); V(0, 4);
    V(1, 2); V(1, 4);
    V(2, 1); V(2, 3);
  }),

  buildMaze("medium1", "The Spiral", "medium", 4, 4, { row: 0, col: 0 }, { row: 1, col: 2 }, 9, (H, V) => {
    H(1, 0); H(1, 2); H(1, 3);
    H(2, 0); H(2, 1); H(2, 3);
    H(3, 1); H(3, 2);
    V(0, 1); V(0, 2); V(0, 3);
    V(1, 1); V(1, 3);
    V(2, 2); V(2, 3);
    V(3, 1);
  }),

  buildMaze("medium2", "The Zigzag", "medium", 5, 4, { row: 0, col: 0 }, { row: 4, col: 3 }, 11, (H, V) => {
    H(1, 1); H(1, 2); H(1, 3);
    H(2, 0); H(2, 1);
    H(3, 2); H(3, 3);
    H(4, 0); H(4, 1);
    V(0, 1); V(0, 2);
    V(1, 2); V(1, 3);
    V(2, 1); V(2, 3);
    V(3, 1); V(3, 2);
    V(4, 2);
  }),

  buildMaze("medium3", "The Fork", "medium", 4, 5, { row: 0, col: 2 }, { row: 3, col: 4 }, 10, (H, V) => {
    H(1, 0); H(1, 1); H(1, 3); H(1, 4);
    H(2, 0); H(2, 2); H(2, 3);
    H(3, 0); H(3, 1); H(3, 2);
    V(0, 1); V(0, 2); V(0, 3); V(0, 4);
    V(1, 2); V(1, 3);
    V(2, 1); V(2, 4);
    V(3, 2); V(3, 3);
  }),

  buildMaze("hard1", "The Labyrinth", "hard", 5, 5, { row: 0, col: 0 }, { row: 4, col: 4 }, 14, (H, V) => {
    H(1, 0); H(1, 2); H(1, 3);
    H(2, 1); H(2, 2); H(2, 4);
    H(3, 0); H(3, 1); H(3, 3);
    H(4, 1); H(4, 2); H(4, 3);
    V(0, 1); V(0, 2); V(0, 3); V(0, 4);
    V(1, 1); V(1, 3); V(1, 4);
    V(2, 1); V(2, 2); V(2, 3);
    V(3, 2); V(3, 4);
    V(4, 1); V(4, 3);
  }),

  buildMaze("hard2", "The Serpent", "hard", 5, 6, { row: 0, col: 0 }, { row: 4, col: 5 }, 16, (H, V) => {
    H(1, 0); H(1, 2); H(1, 3); H(1, 5);
    H(2, 1); H(2, 2); H(2, 3);
    H(3, 0); H(3, 2); H(3, 4); H(3, 5);
    H(4, 0); H(4, 1); H(4, 3); H(4, 4);
    V(0, 1); V(0, 2); V(0, 3); V(0, 4); V(0, 5);
    V(1, 2); V(1, 4); V(1, 5);
    V(2, 1); V(2, 3); V(2, 5);
    V(3, 1); V(3, 2); V(3, 4);
    V(4, 2); V(4, 3);
  }),

  buildMaze("hard3", "The Dungeon", "hard", 6, 5, { row: 0, col: 2 }, { row: 5, col: 2 }, 18, (H, V) => {
    H(1, 0); H(1, 1); H(1, 3); H(1, 4);
    H(2, 0); H(2, 2); H(2, 3);
    H(3, 1); H(3, 2); H(3, 4);
    H(4, 0); H(4, 1); H(4, 3);
    H(5, 0); H(5, 3); H(5, 4);
    V(0, 1); V(0, 2); V(0, 3); V(0, 4);
    V(1, 2); V(1, 3); V(1, 4);
    V(2, 1); V(2, 4);
    V(3, 1); V(3, 3);
    V(4, 2); V(4, 3); V(4, 4);
    V(5, 1); V(5, 2);
  }),
];

export function getMazesByDifficulty(difficulty: "easy" | "medium" | "hard"): MazeData[] {
  return MAZES.filter((m) => m.difficulty === difficulty);
}

export function canMove(
  maze: MazeData,
  from: Cell,
  direction: "up" | "down" | "left" | "right"
): boolean {
  const { row, col } = from;
  const { walls, rows, cols } = maze;

  switch (direction) {
    case "up":
      if (row === 0) return false;
      return !walls.horizontal[row][col];
    case "down":
      if (row === rows - 1) return false;
      return !walls.horizontal[row + 1][col];
    case "left":
      if (col === 0) return false;
      return !walls.vertical[row][col];
    case "right":
      if (col === cols - 1) return false;
      return !walls.vertical[row][col + 1];
  }
}

export function movePlayer(current: Cell, direction: "up" | "down" | "left" | "right"): Cell {
  switch (direction) {
    case "up": return { row: current.row - 1, col: current.col };
    case "down": return { row: current.row + 1, col: current.col };
    case "left": return { row: current.row, col: current.col - 1 };
    case "right": return { row: current.row, col: current.col + 1 };
  }
}

export function isAtExit(current: Cell, exit: Cell): boolean {
  return current.row === exit.row && current.col === exit.col;
}
