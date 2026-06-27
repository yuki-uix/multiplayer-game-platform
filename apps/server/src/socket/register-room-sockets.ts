import type { ClientToServerEvents, ServerToClientEvents } from "@mgp/shared";
import { Server, Socket } from "socket.io";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  applyGameAction,
  getPlayerGameState,
  isKnownGame,
} from "../rooms/room-store";

type PlatformServer = Server<ClientToServerEvents, ServerToClientEvents>;
type PlatformSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** socketId → { roomId, playerId } */
const socketPlayerMap = new Map<string, { roomId: string; playerId: string }>();

/** Grace-period timers before removing a player on disconnect */
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelDisconnectTimer(roomId: string, playerId: string) {
  const key = `${roomId}:${playerId}`;
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

/** Push the per-player private game state to every socket in the room */
function broadcastGameState(io: PlatformServer, roomId: string) {
  const room = getRoom(roomId);
  if (!room || room.gameState === null) return;

  // Collect all sockets currently in this room
  const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
  if (!socketsInRoom) return;

  for (const socketId of socketsInRoom) {
    const entry = socketPlayerMap.get(socketId);
    if (!entry) continue;
    const playerState = getPlayerGameState(roomId, entry.playerId);
    io.to(socketId).emit("server:game:state", { state: playerState });
  }
}

export function registerRoomSockets(io: PlatformServer) {
  io.on("connection", (socket: PlatformSocket) => {
    // ── Room creation ────────────────────────────────────────────────────────

    socket.on("client:room:create", ({ game }, acknowledge) => {
      if (!isKnownGame(game)) {
        socket.emit("server:error", { message: "Unknown game" });
        return;
      }
      const room = createRoom(game);
      if (!room) {
        socket.emit("server:error", { message: "Failed to create room" });
        return;
      }
      socket.join(room.id);
      acknowledge?.({ roomId: room.id });
      socket.emit("server:room:created", { room });
    });

    // ── Room join ─────────────────────────────────────────────────────────────

    socket.on("client:room:join", ({ roomId, player }, acknowledge) => {
      cancelDisconnectTimer(roomId, player.id);

      const room = joinRoom(roomId, player);
      if (!room) {
        socket.emit("server:error", { message: "Room not found" });
        acknowledge?.({ ok: false });
        return;
      }

      socketPlayerMap.set(socket.id, { roomId, playerId: player.id });
      socket.join(roomId);
      acknowledge?.({ ok: true });
      io.to(roomId).emit("server:room:state", { room });
      io.to(roomId).emit("server:room:joined", { room, player });

      // If the game just started, push each player's private initial state
      if (room.status === "playing") {
        broadcastGameState(io, roomId);
      }
    });

    // ── Room leave ────────────────────────────────────────────────────────────

    socket.on("client:room:leave", ({ roomId, playerId }) => {
      cancelDisconnectTimer(roomId, playerId);
      socketPlayerMap.delete(socket.id);
      const room = leaveRoom(roomId, playerId);
      socket.leave(roomId);
      if (room) {
        io.to(roomId).emit("server:room:state", { room });
      }
    });

    // ── Game action ───────────────────────────────────────────────────────────

    socket.on("client:game:action", ({ roomId, action }) => {
      const entry = socketPlayerMap.get(socket.id);
      if (!entry || entry.roomId !== roomId) {
        socket.emit("server:error", { message: "Not in room" });
        return;
      }
      const result = applyGameAction(roomId, entry.playerId, action);
      if (!result.ok) {
        socket.emit("server:error", { message: result.error });
        return;
      }
      broadcastGameState(io, roomId);
    });

    // ── Disconnect ────────────────────────────────────────────────────────────

    socket.on("disconnect", () => {
      const entry = socketPlayerMap.get(socket.id);
      if (!entry) return;
      socketPlayerMap.delete(socket.id);

      const key = `${entry.roomId}:${entry.playerId}`;
      const timer = setTimeout(() => {
        disconnectTimers.delete(key);
        const room = leaveRoom(entry.roomId, entry.playerId);
        if (room) {
          io.to(entry.roomId).emit("server:room:state", { room });
        }
      }, 3000);
      disconnectTimers.set(key, timer);
    });
  });
}
