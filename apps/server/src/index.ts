import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import { registerRoomSockets } from "./socket/register-room-sockets";

const port = Number(process.env.PORT ?? 4000);
const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
});

app.get("/health", async () => ({ ok: true }));

const io = new Server(app.server, {
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  },
});

registerRoomSockets(io);

await app.listen({ port, host: "0.0.0.0" });
