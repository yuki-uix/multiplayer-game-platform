import type { GameEngine } from "@mgp/shared";
import type { GameKind, Player, RoomState } from "@mgp/shared";
import { createGomokuEngine } from "@mgp/gomoku";
import { createNinjaEngine } from "@mgp/ninja";

// ── Game registry ─────────────────────────────────────────────────────────────

type AnyEngine = GameEngine<unknown, unknown>;

const gameRegistry: Record<GameKind, () => AnyEngine> = {
  gomoku: createGomokuEngine,
  ninja: createNinjaEngine,
};

// ── Room record ───────────────────────────────────────────────────────────────

type RoomRecord = RoomState & {
  engine: AnyEngine;
  gameState: unknown;
};

const rooms = new Map<string, RoomRecord>();

// ── TTL cleanup (removes empty rooms after 10 minutes) ───────────────────────

const roomTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleRoomCleanup(roomId: string) {
  cancelRoomCleanup(roomId);
  roomTimers.set(
    roomId,
    setTimeout(() => {
      rooms.delete(roomId);
      roomTimers.delete(roomId);
    }, 10 * 60 * 1000),
  );
}

function cancelRoomCleanup(roomId: string) {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(roomId);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function createRoom(game: GameKind): RoomRecord {
  const engine = gameRegistry[game]();
  const room: RoomRecord = {
    id: crypto.randomUUID().slice(0, 8),
    game,
    players: [],
    status: "waiting",
    engine,
    gameState: null,
    createdAt: new Date().toISOString(),
  };
  rooms.set(room.id, room);
  scheduleRoomCleanup(room.id);
  return room;
}

export function getRoom(roomId: string): RoomRecord | undefined {
  return rooms.get(roomId);
}

export function joinRoom(roomId: string, player: Player): RoomRecord | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  const existing = room.players.find((p) => p.id === player.id);
  if (!existing) {
    room.players.push(player);
  }

  cancelRoomCleanup(roomId);

  // Ninja starts with 4+ players; gomoku starts at 2
  const minPlayers = room.game === "ninja" ? 4 : 2;
  if (room.players.length >= minPlayers && room.status === "waiting") {
    room.gameState = room.engine.createInitialState(room.players);
    room.status = "playing";
  }

  return room;
}

export function leaveRoom(roomId: string, playerId: string): RoomRecord | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  room.players = room.players.filter((p) => p.id !== playerId);

  const minPlayers = room.game === "ninja" ? 4 : 2;
  if (room.players.length < minPlayers && room.status === "playing") {
    room.status = "waiting";
  }

  if (room.players.length === 0) {
    scheduleRoomCleanup(roomId);
  }

  return room;
}

export function applyGameAction(
  roomId: string,
  playerId: string,
  action: unknown,
): { ok: true; room: RoomRecord } | { ok: false; error: string } {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, error: "Room not found" };
  if (room.status !== "playing" || room.gameState === null) {
    return { ok: false, error: "Game not started" };
  }

  const isValid = room.engine.isActionValid(room.gameState, action, playerId);
  if (!isValid) return { ok: false, error: "Invalid action" };

  room.gameState = room.engine.applyAction(room.gameState, action, playerId);
  return { ok: true, room };
}

export function getPlayerGameState(roomId: string, playerId: string): unknown | null {
  const room = rooms.get(roomId);
  if (!room || room.gameState === null) return null;
  return room.engine.getPublicState(room.gameState, playerId);
}
