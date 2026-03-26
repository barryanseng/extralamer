export type Cell = {
  row: number;
  col: number;
};

export type WallSet = {
  horizontal: boolean[][];
  vertical: boolean[][];
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

type Passage = [number, number, number, number];

function buildFromPassages(
  id: string,
  name: string,
  difficulty: "easy" | "medium" | "hard",
  rows: number,
  cols: number,
  start: Cell,
  exit: Cell,
  minMoves: number,
  passages: Passage[]
): MazeData {
  const horizontal: boolean[][] = Array.from({ length: rows + 1 }, () =>
    Array<boolean>(cols).fill(true)
  );
  const vertical: boolean[][] = Array.from({ length: rows }, () =>
    Array<boolean>(cols + 1).fill(true)
  );

  for (const [r1, c1, r2, c2] of passages) {
    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      vertical[r1][minC + 1] = false;
    } else {
      const minR = Math.min(r1, r2);
      horizontal[minR + 1][c1] = false;
    }
  }

  const walls: WallSet = { horizontal, vertical };
  return { id, name, difficulty, rows, cols, start, exit, walls, minMoves };
}

export const MAZES: MazeData[] = [
  buildFromPassages(
    "easy1", "The Descent", "easy",
    3, 3, { row: 0, col: 0 }, { row: 2, col: 2 }, 4,
    [[0,0,1,0],[1,0,1,1],[1,1,2,1],[2,1,2,2]]
  ),

  buildFromPassages(
    "easy2", "The Corridor", "easy",
    3, 3, { row: 0, col: 0 }, { row: 0, col: 2 }, 2,
    [[0,0,0,1],[0,1,0,2]]
  ),

  buildFromPassages(
    "easy3", "The Staircase", "easy",
    4, 3, { row: 0, col: 0 }, { row: 3, col: 2 }, 5,
    [[0,0,1,0],[1,0,1,1],[1,1,2,1],[2,1,2,2],[2,2,3,2]]
  ),

  buildFromPassages(
    "easy4", "The Detour", "easy",
    3, 4, { row: 0, col: 0 }, { row: 0, col: 3 }, 5,
    [[0,0,1,0],[1,0,1,1],[1,1,1,2],[1,2,0,2],[0,2,0,3]]
  ),

  buildFromPassages(
    "medium1", "The Outer Ring", "medium",
    4, 4, { row: 0, col: 0 }, { row: 3, col: 3 }, 10,
    [[0,0,0,1],[0,1,0,2],[0,2,0,3],[0,3,1,3],[1,3,1,2],[1,2,2,2],[2,2,2,1],[2,1,3,1],[3,1,3,2],[3,2,3,3]]
  ),

  buildFromPassages(
    "medium2", "The S-Bend", "medium",
    4, 4, { row: 0, col: 0 }, { row: 3, col: 3 }, 10,
    [[0,0,1,0],[1,0,2,0],[2,0,2,1],[2,1,1,1],[1,1,1,2],[1,2,0,2],[0,2,0,3],[0,3,1,3],[1,3,2,3],[2,3,3,3]]
  ),

  buildFromPassages(
    "medium3", "The Switchback", "medium",
    5, 4, { row: 0, col: 0 }, { row: 4, col: 3 }, 9,
    [[0,0,0,1],[0,1,1,1],[1,1,1,2],[1,2,2,2],[2,2,2,1],[2,1,3,1],[3,1,3,2],[3,2,3,3],[3,3,4,3]]
  ),

  buildFromPassages(
    "hard1", "The Spiral", "hard",
    5, 5, { row: 0, col: 0 }, { row: 4, col: 4 }, 14,
    [[0,0,0,1],[0,1,1,1],[1,1,1,2],[1,2,1,3],[1,3,0,3],[0,3,0,4],[0,4,1,4],[1,4,2,4],[2,4,2,3],[2,3,3,3],[3,3,3,2],[3,2,4,2],[4,2,4,3],[4,3,4,4]]
  ),

  buildFromPassages(
    "hard2", "The Coil", "hard",
    5, 5, { row: 0, col: 0 }, { row: 4, col: 4 }, 16,
    [[0,0,1,0],[1,0,1,1],[1,1,0,1],[0,1,0,2],[0,2,0,3],[0,3,0,4],[0,4,1,4],[1,4,1,3],[1,3,2,3],[2,3,2,4],[2,4,3,4],[3,4,3,3],[3,3,3,2],[3,2,4,2],[4,2,4,3],[4,3,4,4]]
  ),

  buildFromPassages(
    "hard3", "The Gauntlet", "hard",
    5, 5, { row: 0, col: 0 }, { row: 4, col: 4 }, 20,
    [[0,0,0,1],[0,1,0,2],[0,2,0,3],[0,3,0,4],[0,4,1,4],[1,4,1,3],[1,3,1,2],[1,2,1,1],[1,1,1,0],[1,0,2,0],[2,0,2,1],[2,1,2,2],[2,2,2,3],[2,3,2,4],[2,4,3,4],[3,4,3,3],[3,3,3,2],[3,2,4,2],[4,2,4,3],[4,3,4,4]]
  ),
];

export function getMazesByDifficulty(
  difficulty: "easy" | "medium" | "hard"
): MazeData[] {
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
      return row > 0 && !walls.horizontal[row][col];
    case "down":
      return row < rows - 1 && !walls.horizontal[row + 1][col];
    case "left":
      return col > 0 && !walls.vertical[row][col];
    case "right":
      return col < cols - 1 && !walls.vertical[row][col + 1];
  }
}

export function movePlayer(
  current: Cell,
  direction: "up" | "down" | "left" | "right"
): Cell {
  switch (direction) {
    case "up":
      return { row: current.row - 1, col: current.col };
    case "down":
      return { row: current.row + 1, col: current.col };
    case "left":
      return { row: current.row, col: current.col - 1 };
    case "right":
      return { row: current.row, col: current.col + 1 };
  }
}

export function isAtExit(current: Cell, exit: Cell): boolean {
  return current.row === exit.row && current.col === exit.col;
}

export function isDeadEnd(maze: MazeData, pos: Cell): boolean {
  const directions: Array<"up" | "down" | "left" | "right"> = [
    "up",
    "down",
    "left",
    "right",
  ];
  return directions.every((d) => !canMove(maze, pos, d));
}

export function getOpenDirections(
  maze: MazeData,
  pos: Cell
): Array<"up" | "down" | "left" | "right"> {
  const directions: Array<"up" | "down" | "left" | "right"> = [
    "up",
    "down",
    "left",
    "right",
  ];
  return directions.filter((d) => canMove(maze, pos, d));
}

export function bfsSolve(maze: MazeData): number | null {
  const { start, exit, rows, cols } = maze;
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array<boolean>(cols).fill(false)
  );
  const queue: Array<{ cell: Cell; moves: number }> = [
    { cell: start, moves: 0 },
  ];
  visited[start.row][start.col] = true;

  const directions: Array<"up" | "down" | "left" | "right"> = [
    "up",
    "down",
    "left",
    "right",
  ];

  while (queue.length > 0) {
    const item = queue.shift()!;
    const { cell, moves } = item;

    if (isAtExit(cell, exit)) return moves;

    for (const dir of directions) {
      if (canMove(maze, cell, dir)) {
        const next = movePlayer(cell, dir);
        if (!visited[next.row][next.col]) {
          visited[next.row][next.col] = true;
          queue.push({ cell: next, moves: moves + 1 });
        }
      }
    }
  }

  return null;
}
