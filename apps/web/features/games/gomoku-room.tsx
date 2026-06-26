"use client";

import { useMemo } from "react";

type GomokuRoomProps = {
  roomId: string;
};

export function GomokuRoom({ roomId }: GomokuRoomProps) {
  const displayRoomId = roomId === "new" ? "creating..." : roomId;
  const cells = useMemo(() => Array.from({ length: 15 * 15 }), []);

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Gomoku</p>
              <h1 className="mt-1 text-3xl font-semibold">Room {displayRoomId}</h1>
            </div>
            <button className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold">
              Copy Link
            </button>
          </div>

          <div className="aspect-square w-full max-w-[720px] rounded-lg border border-ink/15 bg-[#d8b46f] p-3 shadow-sm">
            <div className="grid h-full w-full grid-cols-15 grid-rows-15">
              {cells.map((_, index) => (
                <button
                  aria-label={`Place stone ${index + 1}`}
                  className="relative border border-ink/30 after:absolute after:left-1/2 after:top-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-ink/20 hover:bg-white/20"
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Players</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
              <span>Waiting for black</span>
              <span className="h-3 w-3 rounded-full bg-ink" />
            </div>
            <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
              <span>Waiting for white</span>
              <span className="h-3 w-3 rounded-full border border-ink/30 bg-white" />
            </div>
          </div>
          <button className="mt-5 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
            Join Room
          </button>
        </aside>
      </section>
    </main>
  );
}
