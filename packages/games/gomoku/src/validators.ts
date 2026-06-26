import type { GomokuAction, GomokuState } from "./types";

export function isInsideBoard(state: GomokuState, row: number, col: number) {
  return row >= 0 && row < state.boardSize && col >= 0 && col < state.boardSize;
}

export function validatePlaceStone(state: GomokuState, action: GomokuAction, playerId: string) {
  if (action.type !== "place-stone") return false;
  if (state.winner) return false;
  if (!isInsideBoard(state, action.row, action.col)) return false;
  if (state.board[action.row][action.col] !== null) return false;

  const player = state.players.find((candidate) => candidate.playerId === playerId);
  return player?.stone === state.currentTurn;
}
