import type { ClientToServerEvents, ServerToClientEvents } from "@mgp/shared";
import { Server, Socket } from "socket.io";
import { createRoom, getRoom, joinRoom, leaveRoom } from "../rooms/room-store";

type PlatformServer = Server<ClientToServerEvents, ServerToClientEvents>;
type PlatformSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const socketPlayerMap = new Map<string, { roomId: string; playerId: string }>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelDisconnectTimer(roomId: string, playerId: string) {
  const key = `${roomId}:${playerId}`;
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

export function registerRoomSockets(io: PlatformServer) {
  io.on("connection", (socket: PlatformSocket) => {
    socket.on("client:room:create", ({ game }, acknowledge) => {
      const room = createRoom(game);
      socket.join(room.id);
      acknowledge?.({ roomId: room.id });
      socket.emit("server:room:created", { room });
    });

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
    });

    socket.on("client:room:leave", ({ roomId, playerId }) => {
      cancelDisconnectTimer(roomId, playerId);
      socketPlayerMap.delete(socket.id);
      const room = leaveRoom(roomId, playerId);
      socket.leave(roomId);
      if (room) {
        io.to(roomId).emit("server:room:state", { room });
      }
    });

    socket.on("disconnect", () => {
      const entry = socketPlayerMap.get(socket.id);
      if (!entry) return;
      socketPlayerMap.delete(socket.id);

      // Grace period: allow reconnection within 3s before removing player
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

    socket.on("client:game:action", ({ roomId }) => {
      const room = getRoom(roomId);
      if (!room) {
        socket.emit("server:error", { message: "Room not found" });
        return;
      }
      socket.emit("server:error", { message: "Game actions are not wired yet" });
    });
  });
}
