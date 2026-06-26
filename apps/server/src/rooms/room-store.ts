import type { GameKind, Player, RoomState } from "@mgp/shared";
import { createGomokuEngine } from "@mgp/gomoku";

type RoomRecord = RoomState & {
  gameState: unknown;
};

const rooms = new Map<string, RoomRecord>();
const gomoku = createGomokuEngine();

export function createRoom(game: GameKind): RoomRecord {
  const room: RoomRecord = {
    id: crypto.randomUUID().slice(0, 8),
    game,
    players: [],
    status: "waiting",
    gameState: null,
    createdAt: new Date().toISOString(),
  };

  rooms.set(room.id, room);
  return room;
}

export function getRoom(roomId: string): RoomRecord | undefined {
  return rooms.get(roomId);
}

export function joinRoom(roomId: string, player: Player): RoomRecord | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  const existing = room.players.find((candidate) => candidate.id === player.id);
  if (!existing) {
    room.players.push(player);
  }

  if (room.game === "gomoku" && room.players.length === 2 && room.status === "waiting") {
    room.gameState = gomoku.createInitialState(room.players);
    room.status = "playing";
  }

  return room;
}

export function leaveRoom(roomId: string, playerId: string): RoomRecord | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  room.players = room.players.filter((player) => player.id !== playerId);
  if (room.players.length < 2 && room.status === "playing") {
    room.status = "waiting";
  }

  return room;
}
