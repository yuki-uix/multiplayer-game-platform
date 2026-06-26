# Multiplayer Game Platform

An MVP web platform for lightweight multiplayer browser games: create a room, send a URL, and play immediately.

The first milestone focuses on a clean technical foundation rather than many games. Gomoku is the initial game plugin.

## Stack

- Next.js, React, TypeScript, Tailwind CSS for the web app
- Node.js, Fastify, Socket.IO for realtime room sync
- pnpm workspace monorepo
- In-memory room state for the MVP

## Workspace

```text
apps/
  web/       Next.js app
  server/    Fastify + Socket.IO realtime server
packages/
  shared/    shared types, socket events, game engine contract
  games/
    gomoku/  Gomoku rules engine
```

## Getting Started

```bash
pnpm install
pnpm dev
```

By default:

- Web: http://localhost:3000
- Server: http://localhost:4000

## MVP Scope

- Anonymous players
- URL-based rooms: `/game/gomoku/[roomId]`
- Realtime player and game state sync
- One game plugin: Gomoku / five-in-a-row
- No accounts, payments, rankings, chat, matchmaking, or database persistence yet

## Scripts

- `pnpm dev` starts web and server in parallel
- `pnpm build` builds all packages and apps
- `pnpm lint` runs lint tasks
- `pnpm typecheck` checks TypeScript
