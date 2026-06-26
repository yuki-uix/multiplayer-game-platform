import type { Player } from "@mgp/shared";

const PLAYER_KEY = "mgp:player";

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function generateName(): string {
  const adjectives = ["Swift", "Quiet", "Brave", "Keen", "Bold"];
  const nouns = ["Fox", "Wolf", "Hawk", "Bear", "Lynx"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export function getOrCreatePlayer(): Player {
  if (typeof window === "undefined") {
    return { id: "ssr", displayName: "Player" };
  }

  const stored = localStorage.getItem(PLAYER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Player;
    } catch {
      // fall through to create new
    }
  }

  const player: Player = { id: generateId(), displayName: generateName() };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}
