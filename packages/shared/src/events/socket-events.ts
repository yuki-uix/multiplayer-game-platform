import type { GameKind, Player, RoomState } from "../types/platform";

export type ClientToServerEvents = {
  "client:room:create": (
    payload: { game: GameKind },
    acknowledge?: (payload: { roomId: string }) => void,
  ) => void;
  "client:room:join": (
    payload: { roomId: string; player: Player },
    acknowledge?: (payload: { ok: boolean }) => void,
  ) => void;
  "client:room:leave": (payload: { roomId: string; playerId: string }) => void;
  "client:game:start": (payload: { roomId: string }) => void;
  "client:game:action": (payload: { roomId: string; action: unknown; playerId: string }) => void;
};

export type ServerToClientEvents = {
  "server:room:created": (payload: { room: RoomState }) => void;
  "server:room:joined": (payload: { room: RoomState; player: Player }) => void;
  "server:room:state": (payload: { room: RoomState }) => void;
  "server:game:state": (payload: { state: unknown }) => void;
  "server:error": (payload: { message: string }) => void;
};
