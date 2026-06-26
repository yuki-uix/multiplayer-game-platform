import type { Player } from "../types/platform";

export interface GameEngine<State, Action> {
  createInitialState(players: Player[]): State;
  isActionValid(state: State, action: Action, playerId: string): boolean;
  applyAction(state: State, action: Action, playerId: string): State;
  getPublicState(state: State, playerId: string): unknown;
}
