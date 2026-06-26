import type { ClientToServerEvents, ServerToClientEvents } from "@mgp/shared";
import { Server, Socket } from "socket.io";
import { createRoom, getRoom, joinRoom, leaveRoom } from "../rooms/room-store";

type PlatformServer = Server<ClientToServerEvents, ServerToClientEvents>;
type PlatformSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const socketPlayerMap = new Map<string, { roomId: string; playerId: string }>();

export function registerRoomSockets(io: PlatformServer) {
  io.on("connection", (socket: PlatformSocket) => {
    socket.on("client:room:create", ({ game }, acknowledge) => {
      const room = createRoom(game);
      socket.join(room.id);
      acknowledge?.({ roomId: room.id });
      socket.emit("server:room:created", { room });
    });

    socket.on("client:room:join", ({ roomId, player }, acknowledge) => {
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
      socketPlayerMap.delete(socket.id);
      const room = leaveRoom(roomId, playerId);
      socket.leave(roomId);
      if (room) {
        io.to(roomId).emit("server:room:state", { room });
      }
    });

    socket.on("disconnect", () => {
      const entry = socketPlayerMap.get(socket.id);
      if (entry) {
        socketPlayerMap.delete(socket.id);
        const room = leaveRoom(entry.roomId, entry.playerId);
        if (room) {
          io.to(entry.roomId).emit("server:room:state", { room });
        }
      }
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
