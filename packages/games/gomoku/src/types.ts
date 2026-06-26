export type Stone = "black" | "white";

export type GomokuCell = Stone | null;

export type GomokuAction = {
  type: "place-stone";
  row: number;
  col: number;
};

export type GomokuPlayer = {
  playerId: string;
  stone: Stone;
};

export type GomokuState = {
  boardSize: 15;
  board: GomokuCell[][];
  players: GomokuPlayer[];
  currentTurn: Stone;
  winner: Stone | null;
  winningLine: Array<{ row: number; col: number }>;
};
