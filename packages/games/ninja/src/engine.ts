import type { Player } from "@mgp/shared";
import type { GameEngine } from "@mgp/shared";
import {
  type NinjaGameState,
  type NinjaAction,
  type NinjaPublicState,
  type NinjaPlayerState,
  type FactionCard,
  type HonorToken,
  type NightPhase,
  type PlayedCardEntry,
  type DraftPickAction,
  type NightPlayAction,
  type ReactionAction,
} from "./types";
import { NINJA_CARDS, NIGHT_PHASE_ORDER, HONOR_TOKEN_VALUES } from "./cards";

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildFactionCards(playerCount: number): FactionCard[] {
  const isOdd = playerCount % 2 === 1;
  const pairCount = Math.floor(playerCount / 2);
  const cards: FactionCard[] = [];
  for (let rank = 1; rank <= pairCount; rank++) {
    cards.push({ faction: "crane", rank });
    cards.push({ faction: "lotus", rank });
  }
  if (isOdd) cards.push({ faction: "ronin", rank: 0 });
  return shuffle(cards);
}

function buildHonorBag(): HonorToken[] {
  return shuffle(HONOR_TOKEN_VALUES.map((value) => ({ value })));
}

function drawFromBag(bag: HonorToken[]): { token: HonorToken; remaining: HonorToken[] } {
  const remaining = [...bag];
  const token = remaining.pop() ?? { value: 2 as const };
  return { token, remaining };
}

function getPlayer(state: NinjaGameState, playerId: string): NinjaPlayerState {
  const p = state.players.find((pl) => pl.playerId === playerId);
  if (!p) throw new Error(`Player not found: ${playerId}`);
  return p;
}

function updatePlayer(
  state: NinjaGameState,
  playerId: string,
  update: Partial<NinjaPlayerState>,
): NinjaGameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.playerId === playerId ? { ...p, ...update } : p,
    ),
  };
}

function nextNightPhase(current: NightPhase): NightPhase | null {
  const idx = NIGHT_PHASE_ORDER.indexOf(current);
  return NIGHT_PHASE_ORDER[idx + 1] ?? null;
}

function hasReactionCard(player: NinjaPlayerState): boolean {
  return player.hand.some((c) => c.kind === "martyr" || c.kind === "redirector");
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function createNinjaEngine(): GameEngine<NinjaGameState, NinjaAction> {
  return {
    createInitialState(players: Player[]): NinjaGameState {
      const ninjaCards = shuffle([...NINJA_CARDS]);
      const factionCards = buildFactionCards(players.length);
      const honorBag = buildHonorBag();

      const playerStates: NinjaPlayerState[] = players.map((p, i) => ({
        playerId: p.id,
        factionCard: factionCards[i] ?? null,
        hand: [],
        playedCards: [],
        alive: true,
        honorTokens: [],
      }));

      const pendingByPlayer: Record<string, typeof ninjaCards> = {};
      players.forEach((p, i) => {
        pendingByPlayer[p.id] = ninjaCards.slice(i * 3, i * 3 + 3);
      });

      return {
        phase: "draft",
        round: 1,
        playerOrder: players.map((p) => p.id),
        players: playerStates,
        draft: { pass: 1, pendingByPlayer, pickedByPlayer: {} },
        night: null,
        discardPile: [],
        honorBag,
        winners: null,
      };
    },

    isActionValid(state: NinjaGameState, action: NinjaAction, playerId: string): boolean {
      const player = state.players.find((p) => p.playerId === playerId);
      if (!player || !player.alive) return false;

      // ── draft_pick ──────────────────────────────────────────────────────────
      if (action.type === "draft_pick") {
        if (state.phase !== "draft" || !state.draft) return false;
        const pending = state.draft.pendingByPlayer[playerId] ?? [];
        return pending.some((c) => c.id === action.cardId);
      }

      // ── night_play ──────────────────────────────────────────────────────────
      if (action.type === "night_play") {
        if (state.phase !== "night" || !state.night) return false;
        // Reaction window is open — only reaction actions are valid now
        if (state.night.pendingReaction) return false;
        // Fix #1: player may only act once per sub-phase
        if (state.night.doneByPlayer.has(playerId)) return false;
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) return false;
        if (card.phase !== state.night.currentPhase) return false;
        if (["blind_assassin", "master_ninja"].includes(card.kind) && !action.targetPlayerId) return false;
        return true;
      }

      // ── night_pass ──────────────────────────────────────────────────────────
      if (action.type === "night_pass") {
        if (state.phase !== "night" || !state.night) return false;
        // During a reaction window, only the targeted player may pass (= decline to react)
        if (state.night.pendingReaction) {
          return state.night.pendingReaction.targetId === playerId;
        }
        return !state.night.doneByPlayer.has(playerId);
      }

      // ── reaction ────────────────────────────────────────────────────────────
      // Fix #3: reaction is valid only when a pendingReaction targets this player
      if (action.type === "reaction") {
        if (state.phase !== "night" || !state.night) return false;
        const pending = state.night.pendingReaction;
        if (!pending || pending.targetId !== playerId) return false;
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) return false;
        if (card.kind !== "martyr" && card.kind !== "redirector") return false;
        if (card.kind === "redirector") {
          if (!action.redirectTargetId) return false;
          // Fix #2: redirectTargetId must be a different alive player
          const redirectTarget = state.players.find((p) => p.playerId === action.redirectTargetId);
          if (!redirectTarget || !redirectTarget.alive) return false;
          if (action.redirectTargetId === playerId) return false;
        }
        return true;
      }

      return false;
    },

    applyAction(state: NinjaGameState, action: NinjaAction, playerId: string): NinjaGameState {
      if (action.type === "draft_pick") return applyDraftPick(state, action, playerId);
      if (action.type === "night_play") return applyNightPlay(state, action, playerId);
      if (action.type === "night_pass") {
        if (state.night?.pendingReaction) return applyReactionPass(state, playerId);
        return applyNightPass(state, playerId);
      }
      if (action.type === "reaction") return applyReaction(state, action, playerId);
      return state;
    },

    getPublicState(state: NinjaGameState, playerId: string): NinjaPublicState {
      const isReveal =
        state.phase === "reveal" || state.phase === "round_end" || state.phase === "game_over";

      return {
        phase: state.phase,
        round: state.round,
        currentNightPhase: state.night?.currentPhase ?? null,
        winners: state.winners,
        pendingReaction: state.night?.pendingReaction ?? null,
        draftPendingCount: state.draft
          ? state.playerOrder.filter((id) => !(id in state.draft!.pickedByPlayer)).length
          : 0,
        players: state.players.map((p) => ({
          playerId: p.playerId,
          alive: p.alive,
          handSize: p.hand.length,
          playedCards: p.playedCards,
          honorTokenCount: p.honorTokens.length,
          totalHonorScore:
            p.playerId === playerId
              ? p.honorTokens.reduce((sum, t) => sum + t.value, 0)
              : -1,
          factionCard: isReveal && p.alive ? p.factionCard : null,
        })),
      };
    },
  };
}

// ── Draft logic ───────────────────────────────────────────────────────────────

function applyDraftPick(
  state: NinjaGameState,
  action: DraftPickAction,
  playerId: string,
): NinjaGameState {
  const draft = state.draft!;
  const pending = draft.pendingByPlayer[playerId] ?? [];
  if (!pending.some((c) => c.id === action.cardId)) return state;

  const newPicked = { ...draft.pickedByPlayer, [playerId]: action.cardId };
  const allPicked = state.playerOrder.every((id) => id in newPicked);

  if (!allPicked) {
    return { ...state, draft: { ...draft, pickedByPlayer: newPicked } };
  }

  return draft.pass === 1
    ? resolvePass1(state, newPicked)
    : resolvePass2(state, newPicked);
}

function resolvePass1(
  state: NinjaGameState,
  pickedByPlayer: Record<string, string>,
): NinjaGameState {
  const draft = state.draft!;

  // Each player keeps their pick; remaining 2 pass LEFT
  const passLeft: Record<string, (typeof NINJA_CARDS)> = {};
  state.playerOrder.forEach((playerId) => {
    const pending = draft.pendingByPlayer[playerId] ?? [];
    passLeft[playerId] = pending.filter((c) => c.id !== pickedByPlayer[playerId]);
  });

  const newPendingByPlayer: Record<string, (typeof NINJA_CARDS)> = {};
  state.playerOrder.forEach((playerId, idx) => {
    const leftIdx = (idx + 1) % state.playerOrder.length;
    newPendingByPlayer[state.playerOrder[leftIdx]] = passLeft[playerId];
  });

  let newState = state;
  state.playerOrder.forEach((playerId) => {
    const chosen = (draft.pendingByPlayer[playerId] ?? []).find(
      (c) => c.id === pickedByPlayer[playerId],
    )!;
    const player = getPlayer(newState, playerId);
    newState = updatePlayer(newState, playerId, { hand: [...player.hand, chosen] });
  });

  return {
    ...newState,
    draft: { pass: 2, pendingByPlayer: newPendingByPlayer, pickedByPlayer: {} },
  };
}

function resolvePass2(
  state: NinjaGameState,
  pickedByPlayer: Record<string, string>,
): NinjaGameState {
  const draft = state.draft!;
  const discards: (typeof NINJA_CARDS) = [];

  let newState = state;
  state.playerOrder.forEach((playerId) => {
    const pending = draft.pendingByPlayer[playerId] ?? [];
    const chosen = pending.find((c) => c.id === pickedByPlayer[playerId])!;
    const discarded = pending.find((c) => c.id !== pickedByPlayer[playerId])!;
    discards.push(discarded);
    const player = getPlayer(newState, playerId);
    newState = updatePlayer(newState, playerId, { hand: [...player.hand, chosen] });
  });

  return {
    ...newState,
    phase: "night",
    draft: null,
    discardPile: [...state.discardPile, ...discards],
    night: {
      currentPhase: "spy",
      playedThisPhase: [],
      doneByPlayer: new Set(),
      resolvedCount: 0,
      pendingReaction: null,
    },
  };
}

// ── Night logic ───────────────────────────────────────────────────────────────

function applyNightPlay(
  state: NinjaGameState,
  action: NightPlayAction,
  playerId: string,
): NinjaGameState {
  const night = state.night!;
  const player = getPlayer(state, playerId);
  const card = player.hand.find((c) => c.id === action.cardId)!;

  // Remove card from hand, add to face-up played cards
  let newState = updatePlayer(state, playerId, {
    hand: player.hand.filter((c) => c.id !== action.cardId),
    playedCards: [...player.playedCards, card],
  });

  const entry: PlayedCardEntry = {
    playerId,
    card,
    targetPlayerId: action.targetPlayerId,
  };

  const newDone = new Set(night.doneByPlayer).add(playerId);

  newState = {
    ...newState,
    night: {
      ...night,
      playedThisPhase: [...night.playedThisPhase, entry],
      doneByPlayer: newDone,
    },
  };

  // Fix #2: don't apply effects here — resolve after all players are done
  return advanceNightIfAllDone(newState);
}

function applyNightPass(state: NinjaGameState, playerId: string): NinjaGameState {
  const night = state.night!;
  const newDone = new Set(night.doneByPlayer).add(playerId);
  const newState = { ...state, night: { ...night, doneByPlayer: newDone } };
  return advanceNightIfAllDone(newState);
}

function advanceNightIfAllDone(state: NinjaGameState): NinjaGameState {
  const night = state.night!;
  // Reaction window pauses advancement
  if (night.pendingReaction) return state;

  const alivePlayers = state.players.filter((p) => p.alive).map((p) => p.playerId);
  const allDone = alivePlayers.every((id) => night.doneByPlayer.has(id));
  if (!allDone) return state;

  // Resolve played cards in number order, starting after already-settled entries
  const sorted = [...night.playedThisPhase].sort((a, b) => a.card.number - b.card.number);
  let resolved = state;

  for (let i = night.resolvedCount; i < sorted.length; i++) {
    resolved = resolveCardEffect(resolved, sorted[i]);
    if (resolved.night?.pendingReaction) {
      // Record that the next entry to process after reaction is i+1
      return {
        ...resolved,
        night: { ...resolved.night!, resolvedCount: i + 1 },
      };
    }
  }

  const next = nextNightPhase(night.currentPhase);
  if (next) {
    return {
      ...resolved,
      night: {
        currentPhase: next,
        playedThisPhase: [],
        doneByPlayer: new Set(),
        resolvedCount: 0,
        pendingReaction: null,
      },
    };
  }

  return resolveReveal(resolved);
}

function resolveCardEffect(state: NinjaGameState, entry: PlayedCardEntry): NinjaGameState {
  const { card, playerId, targetPlayerId } = entry;

  if (card.kind === "blind_assassin" || card.kind === "master_ninja") {
    if (!targetPlayerId) return state;
    const target = state.players.find((p) => p.playerId === targetPlayerId);
    if (!target || !target.alive) return state;

    // Open reaction window if target holds a reaction card
    if (hasReactionCard(target)) {
      return {
        ...state,
        night: {
          ...state.night!,
          pendingReaction: { attackerId: playerId, targetId: targetPlayerId, attackCard: card },
        },
      };
    }

    return killPlayer(state, targetPlayerId);
  }

  // spy / hermit / trickster effects are game-information actions:
  // their resolution requires server-side private pushes, not state mutations here.
  // Stubbed — effects will be implemented when server integration lands.
  return state;
}

// ── Reaction logic ────────────────────────────────────────────────────────────

function applyReaction(
  state: NinjaGameState,
  action: ReactionAction,
  playerId: string,
): NinjaGameState {
  const night = state.night!;
  const pending = night.pendingReaction!;
  const player = getPlayer(state, playerId);
  const card = player.hand.find((c) => c.id === action.cardId)!;

  // Remove reaction card from hand, add to played
  let newState = updatePlayer(state, playerId, {
    hand: player.hand.filter((c) => c.id !== action.cardId),
    playedCards: [...player.playedCards, card],
  });

  // Clear the reaction window
  newState = {
    ...newState,
    night: { ...night, pendingReaction: null },
  };

  if (card.kind === "martyr") {
    // Martyr: kill is negated — target survives, attacker dies
    newState = killPlayer(newState, pending.attackerId);
  } else if (card.kind === "redirector" && action.redirectTargetId) {
    // Redirector: redirect kill to another player
    const redirectTarget = newState.players.find((p) => p.playerId === action.redirectTargetId);
    if (redirectTarget && redirectTarget.alive) {
      newState = killPlayer(newState, action.redirectTargetId);
    }
  }

  // Continue resolving remaining cards in the phase
  return advanceNightIfAllDone(newState);
}

// night_pass during a pending reaction = target declines to react → kill lands
export function applyReactionPass(state: NinjaGameState, playerId: string): NinjaGameState {
  const night = state.night!;
  const pending = night.pendingReaction!;
  if (pending.targetId !== playerId) return state;

  let newState: NinjaGameState = {
    ...state,
    night: { ...night, pendingReaction: null },
  };
  newState = killPlayer(newState, pending.targetId);
  return advanceNightIfAllDone(newState);
}

function killPlayer(state: NinjaGameState, playerId: string): NinjaGameState {
  return updatePlayer(state, playerId, { alive: false });
}

// ── Reveal & scoring ──────────────────────────────────────────────────────────

function resolveReveal(state: NinjaGameState): NinjaGameState {
  const survivors = state.players.filter((p) => p.alive);
  let newState: NinjaGameState = { ...state, phase: "reveal" as const, night: null };

  // Ronin: if survived, gets 1 token
  const ronin = survivors.find((p) => p.factionCard?.faction === "ronin");
  if (ronin) {
    const { token, remaining } = drawFromBag(newState.honorBag);
    newState = updatePlayer(newState, ronin.playerId, {
      honorTokens: [...getPlayer(newState, ronin.playerId).honorTokens, token],
    });
    newState = { ...newState, honorBag: remaining };
  }

  const craneSurvivors = survivors
    .filter((p) => p.factionCard?.faction === "crane")
    .sort((a, b) => a.factionCard!.rank - b.factionCard!.rank);

  const lotusSurvivors = survivors
    .filter((p) => p.factionCard?.faction === "lotus")
    .sort((a, b) => a.factionCard!.rank - b.factionCard!.rank);

  const winningFaction = compareFactionsLexicographic(craneSurvivors, lotusSurvivors);

  if (winningFaction === "tie_all_equal") {
    for (const survivor of survivors) {
      const { token, remaining } = drawFromBag(newState.honorBag);
      newState = updatePlayer(newState, survivor.playerId, {
        honorTokens: [...getPlayer(newState, survivor.playerId).honorTokens, token],
      });
      newState = { ...newState, honorBag: remaining };
    }
  } else if (winningFaction) {
    for (const w of state.players.filter((p) => p.factionCard?.faction === winningFaction)) {
      const { token, remaining } = drawFromBag(newState.honorBag);
      newState = updatePlayer(newState, w.playerId, {
        honorTokens: [...getPlayer(newState, w.playerId).honorTokens, token],
      });
      newState = { ...newState, honorBag: remaining };
    }
  }

  return checkWinCondition(newState);
}

type FactionResult = "crane" | "lotus" | "tie_all_equal" | null;

function compareFactionsLexicographic(
  craneSorted: NinjaPlayerState[],
  lotusSorted: NinjaPlayerState[],
): FactionResult {
  if (craneSorted.length === 0 && lotusSorted.length === 0) return "tie_all_equal";
  if (craneSorted.length === 0) return "lotus";
  if (lotusSorted.length === 0) return "crane";

  const len = Math.min(craneSorted.length, lotusSorted.length);
  for (let i = 0; i < len; i++) {
    const cr = craneSorted[i].factionCard!.rank;
    const lr = lotusSorted[i].factionCard!.rank;
    if (cr < lr) return "crane";
    if (lr < cr) return "lotus";
  }
  if (craneSorted.length !== lotusSorted.length) {
    return craneSorted.length > lotusSorted.length ? "crane" : "lotus";
  }
  return "tie_all_equal";
}

function checkWinCondition(state: NinjaGameState): NinjaGameState {
  const WIN_THRESHOLD = 10;
  const scores = state.players.map((p) => ({
    playerId: p.playerId,
    score: p.honorTokens.reduce((s, t) => s + t.value, 0),
  }));

  const qualifiers = scores.filter((s) => s.score >= WIN_THRESHOLD);
  if (qualifiers.length === 0) return startNewRound(state);

  const maxScore = Math.max(...qualifiers.map((s) => s.score));
  const winners = qualifiers.filter((s) => s.score === maxScore).map((s) => s.playerId);
  return { ...state, phase: "game_over", winners };
}

function startNewRound(state: NinjaGameState): NinjaGameState {
  const ninjaCards = shuffle([...NINJA_CARDS]);
  const factionCards = buildFactionCards(state.players.length);
  const pendingByPlayer: Record<string, typeof ninjaCards> = {};
  state.playerOrder.forEach((playerId, i) => {
    pendingByPlayer[playerId] = ninjaCards.slice(i * 3, i * 3 + 3);
  });

  return {
    ...state,
    phase: "draft",
    round: state.round + 1,
    players: state.players.map((p, i) => ({
      ...p,
      factionCard: factionCards[i] ?? null,
      hand: [],
      playedCards: [],
      alive: true,
    })),
    draft: { pass: 1, pendingByPlayer, pickedByPlayer: {} },
    night: null,
    discardPile: [],
  };
}
