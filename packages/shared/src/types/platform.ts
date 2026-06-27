export type GameKind = "gomoku" | "ninja";

export type Player = {
  id: string;
  displayName: string;
};

export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomState = {
  id: string;
  game: GameKind;
  players: Player[];
  status: RoomStatus;
  createdAt: string;
};
