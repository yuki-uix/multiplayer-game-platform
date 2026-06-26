import type { NinjaCard } from "./types";

/**
 * 33 ninja cards per the rulebook.
 * Each card has a phase (determines which night sub-phase it can be played in)
 * and a number (1–6, lower = resolved first within that phase).
 *
 * Reaction cards (martyr, redirector) and boss card have phase=null —
 * they are not played during a normal sub-phase.
 */
export const NINJA_CARDS: NinjaCard[] = [
  // ── Spy (密探) ── 6 cards
  { id: "spy-1", kind: "spy", phase: "spy", number: 1, name: "密探·壹" },
  { id: "spy-2", kind: "spy", phase: "spy", number: 2, name: "密探·贰" },
  { id: "spy-3", kind: "spy", phase: "spy", number: 3, name: "密探·叁" },
  { id: "spy-4", kind: "spy", phase: "spy", number: 4, name: "密探·肆" },
  { id: "spy-5", kind: "spy", phase: "spy", number: 5, name: "密探·伍" },
  { id: "spy-6", kind: "spy", phase: "spy", number: 6, name: "密探·陆" },

  // ── Hermit (隐士) ── 4 cards
  { id: "hermit-1", kind: "hermit", phase: "hermit", number: 1, name: "隐士·壹" },
  { id: "hermit-2", kind: "hermit", phase: "hermit", number: 2, name: "隐士·贰" },
  { id: "hermit-3", kind: "hermit", phase: "hermit", number: 3, name: "隐士·叁" },
  { id: "hermit-4", kind: "hermit", phase: "hermit", number: 4, name: "隐士·肆" },

  // ── Trickster (骗徒) ── 6 cards, each unique
  { id: "trickster-1", kind: "trickster", phase: "trickster", number: 1, name: "百变者" },
  { id: "trickster-2", kind: "trickster", phase: "trickster", number: 2, name: "骗徒·贰" },
  { id: "trickster-3", kind: "trickster", phase: "trickster", number: 3, name: "骗徒·叁" },
  { id: "trickster-4", kind: "trickster", phase: "trickster", number: 4, name: "骗徒·肆" },
  { id: "trickster-5", kind: "trickster", phase: "trickster", number: 5, name: "骗徒·伍" },
  { id: "trickster-6", kind: "trickster", phase: "trickster", number: 6, name: "骗徒·陆" },

  // ── Blind Assassin (盲眼刺客) ── 5 cards
  { id: "blind-1", kind: "blind_assassin", phase: "blind_assassin", number: 1, name: "盲眼刺客·壹" },
  { id: "blind-2", kind: "blind_assassin", phase: "blind_assassin", number: 2, name: "盲眼刺客·贰" },
  { id: "blind-3", kind: "blind_assassin", phase: "blind_assassin", number: 3, name: "盲眼刺客·叁" },
  { id: "blind-4", kind: "blind_assassin", phase: "blind_assassin", number: 4, name: "盲眼刺客·肆" },
  { id: "blind-5", kind: "blind_assassin", phase: "blind_assassin", number: 5, name: "盲眼刺客·伍" },

  // ── Master Ninja (上忍) ── 5 cards
  { id: "master-1", kind: "master_ninja", phase: "master_ninja", number: 1, name: "上忍·壹" },
  { id: "master-2", kind: "master_ninja", phase: "master_ninja", number: 2, name: "上忍·贰" },
  { id: "master-3", kind: "master_ninja", phase: "master_ninja", number: 3, name: "上忍·叁" },
  { id: "master-4", kind: "master_ninja", phase: "master_ninja", number: 4, name: "上忍·肆" },
  { id: "master-5", kind: "master_ninja", phase: "master_ninja", number: 5, name: "上忍·伍" },

  // ── Reaction cards ── phase=null (played in response to being targeted)
  { id: "martyr-1", kind: "martyr", phase: null, number: 1, name: "殉道者·壹" },
  { id: "martyr-2", kind: "martyr", phase: null, number: 2, name: "殉道者·贰" },
  { id: "redirector-1", kind: "redirector", phase: null, number: 1, name: "还施者·壹" },
  { id: "redirector-2", kind: "redirector", phase: null, number: 2, name: "还施者·贰" },

  // ── Boss card ── revealed at round end if alive
  { id: "boss-1", kind: "boss", phase: null, number: 1, name: "首脑·壹" },
  { id: "boss-2", kind: "boss", phase: null, number: 2, name: "首脑·贰" },
  { id: "boss-3", kind: "boss", phase: null, number: 3, name: "首脑·叁" },
];

export const NIGHT_PHASE_ORDER = [
  "spy",
  "hermit",
  "trickster",
  "blind_assassin",
  "master_ninja",
] as const;

export const HONOR_TOKEN_VALUES: Array<2 | 3 | 4> = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2, // 10×2
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 10×3
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, // 10×4
  // 5 spare tokens omitted from bag; bag total = 30
];
