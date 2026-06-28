# Tablelink

**Multiplayer browser party games — share a URL, play instantly, no app required.**

Live → **[multiplayer-game-platform-web.vercel.app](https://multiplayer-game-platform-web.vercel.app)**

---

## What it is

Tablelink is a browser-based multiplayer game platform built for team activities and in-person gatherings. The host creates a room and shares a link; everyone else joins on their phone without downloading anything.

The current game is **Night of the Ninja (忍者之夜)** — a hidden-identity party game for 4–8 players involving faction cards, a two-pass card draft, and a structured night phase where spies, assassins, and tricksters act in secret.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  Browser (Next.js · Vercel)                            │
│  ┌──────────────┐   Socket.IO client                   │
│  │  React UI    │ ◄──────────────────────────────┐    │
│  └──────────────┘                                │    │
└─────────────────────────────────────────────────-┼────┘
                                                   │ WebSocket
┌──────────────────────────────────────────────────┼────┐
│  Server (Fastify + Socket.IO · Railway)           │    │
│                                                   │    │
│  ┌─────────────┐    ┌──────────────┐  per-player  │    │
│  │  Room Store │───►│ Game Engine  │──────push──► ┘   │
│  │  (in-memory)│    │  Plugin      │                   │
│  └─────────────┘    └──────────────┘                   │
└────────────────────────────────────────────────────────┘
```

### Key design decisions

**Per-player private state**

Each player receives a different view of the game. The `GameEngine` interface exposes `getPublicState(state, playerId)`, which filters shared state to include only what that player is allowed to see — their hand, their faction card, intel gathered from spy/hermit cards. The server iterates every socket in the room and pushes a personalised payload to each one individually.

```typescript
interface GameEngine<S, A> {
  createInitialState(players: Player[]): S;
  isActionValid(state: S, action: A, playerId: string): boolean;
  applyAction(state: S, action: A, playerId: string): S;
  getPublicState(state: S, playerId: string): unknown; // ← different per player
}
```

**Plugin-based game registry**

Games register as lazy factory functions. Adding a new game only requires implementing `GameEngine` and one registry entry — the room and socket layers are entirely game-agnostic.

```typescript
const gameRegistry: Record<GameKind, () => AnyEngine> = {
  ninja: () => createNinjaEngine(),
  // next game goes here
};
```

**Server-side identity for game actions**

When a player joins, they supply their own `playerId` (a locally-generated UUID stored in `localStorage`) — this is trusted by design and enables reconnect. Once joined, however, the server records the mapping in `Map<socketId, { roomId, playerId }>` and reads **only from that map** when processing game actions. The client-supplied `playerId` field in action payloads is ignored entirely, so a connected client cannot act as a different player mid-game.

**Graceful disconnect**

A 3-second grace-period timer fires on socket disconnect. If the same `playerId` reconnects within that window the timer cancels and the player resumes seamlessly. The server only removes the player after the window expires.

---

## Game: Night of the Ninja (忍者之夜)

A hidden-identity game with structured asymmetric information.

**Round flow**

1. **Draft** — each player is dealt 3 ninja cards and picks 2 across two passes (snake draft). Cards are private.
2. **Night** — five sub-phases resolve in fixed order: Spy → Hermit → Trickster → Blind Assassin → Master Ninja. Players play a matching card or pass.
3. **Reveal** — faction cards flip; the winning faction earns Honor Tokens. At round end, if any player has reached ≥ 10 Honor Points, the player with the highest score wins (tied scores share the win).

**Implemented card effects**

| Card | Effect |
|------|--------|
| Spy (密探) | Privately reveals target's faction to the spy only |
| Hermit (隐士) | Privately reveals target's faction + one random hand card |
| Trickster-3 捣乱者 | Publicly reveals target's faction to all players |
| Trickster-5 小偷 | Reveals own faction; steals a token from the richest player |
| Trickster-6 审判者 | Kills target, bypasses all reaction cards |
| Blind Assassin (盲眼刺客) | Attempts to kill without seeing target's faction |
| Master Ninja (上忍) | Views target's faction, then decides whether to kill |
| Martyr 镜僧 | Reaction — attacker dies instead |
| Redirector 殉道者 | Reaction — redirects kill to another player |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind CSS |
| Realtime | Socket.IO (WebSocket with polling fallback) |
| Backend | Fastify, Node.js, TypeScript |
| Monorepo | pnpm workspaces |
| Deploy | Vercel (web) + Railway (server) |

```
apps/
  web/          Next.js frontend
  server/       Fastify + Socket.IO server
packages/
  shared/       Types, socket event contracts, GameEngine interface
  games/
    ninja/      Night of the Ninja engine + card definitions
    gomoku/     Five-in-a-row (stub)
```

---

## Local development

```bash
pnpm install
pnpm dev        # web :3000 · server :4000
pnpm typecheck  # type-check all packages
pnpm build      # build everything
```

**Environment variables** (production only):

| Variable | Service | Purpose |
|----------|---------|---------|
| `PORT` | Server | Port assigned by Railway |
| `WEB_ORIGIN` | Server | Vercel URL for CORS |
| `NEXT_PUBLIC_SERVER_URL` | Web | Railway URL for Socket.IO client |
