// ── Factions ────────────────────────────────────────────────────────────────

export type Faction = "crane" | "lotus" | "ronin";

export type FactionCard = {
  faction: Faction;
  rank: number; // 1 = highest; ronin has no rank (undefined)
};

// ── Ninja cards ──────────────────────────────────────────────────────────────

/** Fixed order of night sub-phases per rulebook */
export type NightPhase = "spy" | "hermit" | "trickster" | "blind_assassin" | "master_ninja";

export type NinjaCardKind =
  | "spy"
  | "hermit"
  | "trickster"
  | "blind_assassin"
  | "master_ninja"
  | "martyr"      // reaction: counter blind_assassin / master_ninja
  | "redirector"  // reaction: redirect kill to another player
  | "boss";       // revealed at round end if alive

export type NinjaCard = {
  id: string;
  kind: NinjaCardKind;
  phase: NightPhase | null; // null for reaction/boss cards (not played in a phase)
  number: number;           // 1–6, resolution order within the phase (lower = earlier)
  name: string;
};

// ── Honor tokens ─────────────────────────────────────────────────────────────

export type HonorToken = {
  value: 2 | 3 | 4;
};

// ── Per-player private state ──────────────────────────────────────────────────

export type NinjaPlayerState = {
  playerId: string;
  factionCard: FactionCard | null;  // null before deal; hidden from others until reveal
  hand: NinjaCard[];                // 2 cards after draft; private
  playedCards: NinjaCard[];         // face-up cards played this round
  alive: boolean;
  honorTokens: HonorToken[];
};

// ── Draft state ───────────────────────────────────────────────────────────────

/**
 * Two-pass draft:
 *   pass 1 — each player holds 3, picks 1, passes 2 left
 *   pass 2 — each player holds 2, picks 1, discards 1 to center
 */
export type DraftPass = 1 | 2;

export type DraftState = {
  pass: DraftPass;
  /** Cards currently held by each player waiting to pick; indexed by playerId */
  pendingByPlayer: Record<string, NinjaCard[]>;
  /** Players who have submitted their pick for the current pass */
  pickedByPlayer: Record<string, string>; // playerId → chosen card id
};

// ── Night state ───────────────────────────────────────────────────────────────

export type PlayedCardEntry = {
  playerId: string;
  card: NinjaCard;
  targetPlayerId?: string; // for blind_assassin / master_ninja
};

/**
 * When a kill card resolves against a target who holds a reaction card,
 * we pause resolution and wait for their reaction (or explicit pass).
 */
export type PendingReaction = {
  attackerId: string;
  targetId: string;
  attackCard: NinjaCard;
};

export type NightState = {
  currentPhase: NightPhase;
  /** Cards played (face-up) in the current sub-phase, in insertion order */
  playedThisPhase: PlayedCardEntry[];
  /** Players who have declared done for the current sub-phase (pass or played) */
  doneByPlayer: Set<string>;
  /**
   * Non-null when a kill is pending and the target may react.
   * Resolution is paused until the target plays a reaction card or passes.
   */
  pendingReaction: PendingReaction | null;
};

// ── Round phases ──────────────────────────────────────────────────────────────

export type RoundPhase =
  | "round_start"      // dealing faction cards
  | "draft"            // ninja card draft (2 passes)
  | "night"            // 5 sub-phases
  | "reveal"           // faction reveal + scoring
  | "round_end"        // distribute tokens, check win
  | "game_over";

// ── Full game state ───────────────────────────────────────────────────────────

export type NinjaGameState = {
  phase: RoundPhase;
  round: number;
  playerOrder: string[];           // playerId in seat order (determines pass direction)
  players: NinjaPlayerState[];
  draft: DraftState | null;        // non-null during "draft" phase
  night: NightState | null;        // non-null during "night" phase
  discardPile: NinjaCard[];        // face-down discards from draft
  honorBag: HonorToken[];          // remaining tokens to draw from
  winners: string[] | null;        // playerId(s) when game_over
};

// ── Actions ───────────────────────────────────────────────────────────────────

/** Player submits their draft pick for the current pass */
export type DraftPickAction = {
  type: "draft_pick";
  cardId: string;
};

/** Player plays a ninja card face-up in the current night sub-phase */
export type NightPlayAction = {
  type: "night_play";
  cardId: string;
  targetPlayerId?: string; // required for blind_assassin and master_ninja
};

/** Player passes (chooses not to play) in the current night sub-phase */
export type NightPassAction = {
  type: "night_pass";
};

/** Player plays a reaction card (martyr or redirector) in response to being targeted */
export type ReactionAction = {
  type: "reaction";
  cardId: string;
  redirectTargetId?: string; // required for redirector
};

export type NinjaAction =
  | DraftPickAction
  | NightPlayAction
  | NightPassAction
  | ReactionAction;

// ── Public view (per-player) ──────────────────────────────────────────────────

/** Stripped state safe to send to a specific player */
export type NinjaPublicPlayerView = {
  playerId: string;
  alive: boolean;
  handSize: number;              // how many cards they hold (count only)
  playedCards: NinjaCard[];      // face-up cards, visible to all
  honorTokenCount: number;       // total tokens (not values, those are private)
  totalHonorScore: number;       // own score visible to self only — set to -1 for others
  factionCard: FactionCard | null; // null until reveal phase
};

export type NinjaPublicState = {
  phase: RoundPhase;
  round: number;
  currentNightPhase: NightPhase | null;
  players: NinjaPublicPlayerView[];
  winners: string[] | null;
  /** Draft: how many players still need to pick (so UI can show "waiting for N") */
  draftPendingCount: number;
  /** Non-null when a reaction window is open; only the target may act */
  pendingReaction: PendingReaction | null;
};
