import { GameCard } from "../features/games/game-card";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <section className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">Tablelink</p>
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
              Send a URL and start a tiny game room.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              A clean multiplayer foundation for browser games, starting with Gomoku.
            </p>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <GameCard
            title="Gomoku"
            description="15x15 five-in-a-row for two players."
            href="/game/gomoku/new"
          />
        </div>
      </section>
    </main>
  );
}
