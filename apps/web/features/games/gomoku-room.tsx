"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../../lib/socket";
import { getOrCreatePlayer } from "../../lib/player";
import { useRoomStore } from "../../store/room-store";
import type { RoomState } from "@mgp/shared";

type GomokuRoomProps = {
  roomId: string;
};

export function GomokuRoom({ roomId }: GomokuRoomProps) {
  const router = useRouter();
  const isNew = roomId === "new";

  const { connection, room, me, setConnection, setRoom, setMe } = useRoomStore();

  const cells = useMemo(() => Array.from({ length: 15 * 15 }), []);

  useEffect(() => {
    let active = true;
    const player = getOrCreatePlayer();
    setMe(player);
    setConnection("connecting");
    socket.connect();

    function onConnect() {
      if (!active) return;
      setConnection("connected");

      if (isNew) {
        socket.emit("client:room:create", { game: "gomoku" }, (payload: { roomId: string }) => {
          if (active) router.replace(`/game/gomoku/${payload.roomId}`);
        });
      } else {
        socket.emit("client:room:join", { roomId, player }, (payload: { ok: boolean }) => {
          if (active && !payload.ok) router.replace("/");
        });
      }
    }

    function onRoomState({ room: r }: { room: RoomState }) {
      if (active) setRoom(r);
    }

    function onRoomCreated({ room: r }: { room: RoomState }) {
      if (active) setRoom(r);
    }

    function onRoomJoined({ room: r }: { room: RoomState }) {
      if (active) setRoom(r);
    }

    socket.on("connect", onConnect);
    socket.on("server:room:state", onRoomState);
    socket.on("server:room:created", onRoomCreated);
    socket.on("server:room:joined", onRoomJoined);
    socket.on("server:error", ({ message }) => console.error("Server error:", message));

    return () => {
      active = false;
      socket.off("connect", onConnect);
      socket.off("server:room:state", onRoomState);
      socket.off("server:room:created", onRoomCreated);
      socket.off("server:room:joined", onRoomJoined);
      socket.off("server:error");
      if (!isNew && player) {
        socket.emit("client:room:leave", { roomId, playerId: player.id });
      }
      socket.disconnect();
      setConnection("disconnected");
    };
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  const isWaiting = !room || room.status === "waiting";
  const players = room?.players ?? [];

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Gomoku</p>
              <h1 className="mt-1 text-3xl font-semibold">
                Room {isNew ? "…" : roomId}
              </h1>
            </div>
            {!isNew && (
              <button
                onClick={copyLink}
                className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold"
              >
                Copy Link
              </button>
            )}
          </div>

          {isWaiting && !isNew && (
            <div className="mb-4 rounded-md border border-ink/10 bg-white px-4 py-3 text-sm text-ink/60">
              Waiting for another player — share the link to invite someone.
            </div>
          )}

          <div className="aspect-square w-full max-w-[720px] rounded-lg border border-ink/15 bg-[#d8b46f] p-3 shadow-sm">
            <div className="grid h-full w-full grid-cols-15 grid-rows-15">
              {cells.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Place stone ${index + 1}`}
                  disabled={isWaiting}
                  className="relative border border-ink/30 after:absolute after:left-1/2 after:top-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-ink/20 hover:bg-white/20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Players</h2>
            <span className="text-xs text-ink/40">
              {connection === "connected" ? "● online" : "○ connecting"}
            </span>
          </div>

          <div className="space-y-3">
            <PlayerSlot label="Black" player={players[0]} isMe={players[0]?.id === me?.id} />
            <PlayerSlot label="White" player={players[1]} isMe={players[1]?.id === me?.id} />
          </div>

          {isNew && (
            <p className="mt-5 text-sm text-ink/50">Creating room…</p>
          )}
        </aside>
      </section>
    </main>
  );
}

function PlayerSlot({
  label,
  player,
  isMe,
}: {
  label: string;
  player: { displayName: string } | undefined;
  isMe: boolean;
}) {
  const isBlack = label === "Black";

  return (
    <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-3 w-3 rounded-full ${isBlack ? "bg-ink" : "border border-ink/30 bg-white"}`}
        />
        <span className="text-sm">
          {player ? (
            <>
              {player.displayName}
              {isMe && <span className="ml-1 text-xs text-ink/40">(you)</span>}
            </>
          ) : (
            <span className="text-ink/40">Waiting for {label.toLowerCase()}…</span>
          )}
        </span>
      </div>
    </div>
  );
}
