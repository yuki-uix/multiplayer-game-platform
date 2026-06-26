import type { GameEngine, Player } from "@mgp/shared";
import type { GomokuAction, GomokuState, Stone } from "./types";
import { validatePlaceStone } from "./validators";

const BOARD_SIZE = 15;
const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
] as const;

export function createGomokuEngine(): GameEngine<GomokuState, GomokuAction> {
  return {
    createInitialState(players) {
      return createInitialState(players);
    },
    isActionValid(state, action, playerId) {
      return validatePlaceStone(state, action, playerId);
    },
    applyAction(state, action, playerId) {
      if (!validatePlaceStone(state, action, playerId)) {
        return state;
      }

      const player = state.players.find((candidate) => candidate.playerId === playerId);
      if (!player) return state;

      const board = state.board.map((row) => [...row]);
      board[action.row][action.col] = player.stone;
      const winningLine = findWinningLine(board, action.row, action.col, player.stone);

      return {
        ...state,
        board,
        currentTurn: player.stone === "black" ? "white" : "black",
        winner: winningLine.length >= 5 ? player.stone : null,
        winningLine,
      };
    },
    getPublicState(state) {
      return state;
    },
  };
}

function createInitialState(players: Player[]): GomokuState {
  return {
    boardSize: BOARD_SIZE,
    board: Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null)),
    players: players.slice(0, 2).map((player, index) => ({
      playerId: player.id,
      stone: index === 0 ? "black" : "white",
    })),
    currentTurn: "black",
    winner: null,
    winningLine: [],
  };
}

function findWinningLine(board: GomokuState["board"], row: number, col: number, stone: Stone) {
  for (const [rowDelta, colDelta] of DIRECTIONS) {
    const line = [
      ...collect(board, row, col, stone, -rowDelta, -colDelta).reverse(),
      { row, col },
      ...collect(board, row, col, stone, rowDelta, colDelta),
    ];

    if (line.length >= 5) {
      return line;
    }
  }

  return [];
}

function collect(
  board: GomokuState["board"],
  row: number,
  col: number,
  stone: Stone,
  rowDelta: number,
  colDelta: number,
) {
  const cells: Array<{ row: number; col: number }> = [];
  let nextRow = row + rowDelta;
  let nextCol = col + colDelta;

  while (board[nextRow]?.[nextCol] === stone) {
    cells.push({ row: nextRow, col: nextCol });
    nextRow += rowDelta;
    nextCol += colDelta;
  }

  return cells;
}
