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
  type DraftPickAction,
  type NightPlayAction,
  type NightPassAction,
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
  if (isOdd) {
    cards.push({ faction: "ronin", rank: 0 });
  }
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

      // Deal 3 cards per player for draft pass 1
      const pendingByPlayer: Record<string, typeof ninjaCards> = {};
      players.forEach((p, i) => {
        pendingByPlayer[p.id] = ninjaCards.slice(i * 3, i * 3 + 3);
      });

      return {
        phase: "draft",
        round: 1,
        playerOrder: players.map((p) => p.id),
        players: playerStates,
        draft: {
          pass: 1,
          pendingByPlayer,
          pickedByPlayer: {},
        },
        night: null,
        discardPile: [],
        honorBag,
        winners: null,
      };
    },

    isActionValid(state: NinjaGameState, action: NinjaAction, playerId: string): boolean {
      const player = state.players.find((p) => p.playerId === playerId);
      if (!player || !player.alive) return false;

      if (action.type === "draft_pick") {
        if (state.phase !== "draft" || !state.draft) return false;
        const pending = state.draft.pendingByPlayer[playerId] ?? [];
        return pending.some((c) => c.id === action.cardId);
      }

      if (action.type === "night_play") {
        if (state.phase !== "night" || !state.night) return false;
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) return false;
        if (card.phase !== state.night.currentPhase) return false;
        if (["blind_assassin", "master_ninja"].includes(card.kind) && !action.targetPlayerId) return false;
        return true;
      }

      if (action.type === "night_pass") {
        if (state.phase !== "night" || !state.night) return false;
        return !state.night.doneByPlayer.has(playerId);
      }

      return false;
    },

    applyAction(state: NinjaGameState, action: NinjaAction, playerId: string): NinjaGameState {
      if (action.type === "draft_pick") {
        return applyDraftPick(state, action, playerId);
      }
      if (action.type === "night_play") {
        return applyNightPlay(state, action, playerId);
      }
      if (action.type === "night_pass") {
        return applyNightPass(state, playerId);
      }
      return state;
    },

    getPublicState(state: NinjaGameState, playerId: string): NinjaPublicState {
      const isReveal = state.phase === "reveal" || state.phase === "round_end" || state.phase === "game_over";

      return {
        phase: state.phase,
        round: state.round,
        currentNightPhase: state.night?.currentPhase ?? null,
        winners: state.winners,
        draftPendingCount: state.draft
          ? state.playerOrder.filter((id) => !(id in (state.draft!.pickedByPlayer))).length
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
  const picked = pending.find((c) => c.id === action.cardId);
  if (!picked) return state;

  const newPicked = { ...draft.pickedByPlayer, [playerId]: action.cardId };
  const allPicked = state.playerOrder.every((id) => id in newPicked);

  if (!allPicked) {
    return {
      ...state,
      draft: { ...draft, pickedByPlayer: newPicked },
    };
  }

  // All players have picked — resolve the pass
  if (draft.pass === 1) {
    return resolvePass1(state, newPicked);
  } else {
    return resolvePass2(state, newPicked);
  }
}

function resolvePass1(
  state: NinjaGameState,
  pickedByPlayer: Record<string, string>,
): NinjaGameState {
  const draft = state.draft!;
  const newPendingByPlayer: Record<string, typeof NINJA_CARDS> = {};

  // Each player keeps their pick, passes remaining 2 to the LEFT
  const passLeft: Record<string, typeof NINJA_CARDS> = {};
  state.playerOrder.forEach((playerId) => {
    const pending = draft.pendingByPlayer[playerId] ?? [];
    const chosenId = pickedByPlayer[playerId];
    passLeft[playerId] = pending.filter((c) => c.id !== chosenId);
  });

  // Left = next player in order (wraps around)
  state.playerOrder.forEach((playerId, idx) => {
    const leftIdx = (idx + 1) % state.playerOrder.length;
    const leftId = state.playerOrder[leftIdx];
    newPendingByPlayer[leftId] = passLeft[playerId];
  });

  // Add chosen cards to each player's hand
  let newState = state;
  state.playerOrder.forEach((playerId) => {
    const pending = draft.pendingByPlayer[playerId] ?? [];
    const chosen = pending.find((c) => c.id === pickedByPlayer[playerId])!;
    const player = getPlayer(newState, playerId);
    newState = updatePlayer(newState, playerId, { hand: [...player.hand, chosen] });
  });

  return {
    ...newState,
    draft: {
      pass: 2,
      pendingByPlayer: newPendingByPlayer,
      pickedByPlayer: {},
    },
  };
}

function resolvePass2(
  state: NinjaGameState,
  pickedByPlayer: Record<string, string>,
): NinjaGameState {
  const draft = state.draft!;
  const discards: typeof NINJA_CARDS = [];

  let newState = state;
  state.playerOrder.forEach((playerId) => {
    const pending = draft.pendingByPlayer[playerId] ?? [];
    const chosenId = pickedByPlayer[playerId];
    const chosen = pending.find((c) => c.id === chosenId)!;
    const discarded = pending.find((c) => c.id !== chosenId)!;
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

  const newHand = player.hand.filter((c) => c.id !== action.cardId);
  const newPlayed = [...player.playedCards, card];

  let newState = updatePlayer(state, playerId, { hand: newHand, playedCards: newPlayed });

  const newDone = new Set(night.doneByPlayer).add(playerId);
  const newPlayedThisPhase = [...night.playedThisPhase, { playerId, card }];

  newState = {
    ...newState,
    night: { ...night, playedThisPhase: newPlayedThisPhase, doneByPlayer: newDone },
  };

  // Apply kill effects immediately for blind_assassin and master_ninja
  if (card.kind === "blind_assassin" && action.targetPlayerId) {
    newState = killPlayer(newState, action.targetPlayerId);
  }
  if (card.kind === "master_ninja" && action.targetPlayerId) {
    newState = killPlayer(newState, action.targetPlayerId);
  }

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
  const alivePlayers = state.players.filter((p) => p.alive).map((p) => p.playerId);
  const allDone = alivePlayers.every((id) => night.doneByPlayer.has(id));
  if (!allDone) return state;

  const next = nextNightPhase(night.currentPhase);
  if (next) {
    return {
      ...state,
      night: { currentPhase: next, playedThisPhase: [], doneByPlayer: new Set() },
    };
  }

  // All night phases done → reveal
  return resolveReveal(state);
}

function killPlayer(state: NinjaGameState, playerId: string): NinjaGameState {
  return updatePlayer(state, playerId, { alive: false });
}

// ── Reveal & scoring ──────────────────────────────────────────────────────────

function resolveReveal(state: NinjaGameState): NinjaGameState {
  const survivors = state.players.filter((p) => p.alive);

  // Ronin: if survived, gets 1 token
  let newState: NinjaGameState = { ...state, phase: "reveal" as const, night: null };

  const ronin = survivors.find((p) => p.factionCard?.faction === "ronin");
  if (ronin) {
    const { token, remaining } = drawFromBag(newState.honorBag);
    newState = updatePlayer(newState, ronin.playerId, {
      honorTokens: [...ronin.honorTokens, token],
    });
    newState = { ...newState, honorBag: remaining };
  }

  // Faction scoring: compare surviving crane vs lotus by highest rank (1 = best)
  const craneSurvivors = survivors
    .filter((p) => p.factionCard?.faction === "crane")
    .sort((a, b) => (a.factionCard!.rank) - (b.factionCard!.rank));

  const lotusSurvivors = survivors
    .filter((p) => p.factionCard?.faction === "lotus")
    .sort((a, b) => (a.factionCard!.rank) - (b.factionCard!.rank));

  const winningFaction = compareFactionsLexicographic(craneSurvivors, lotusSurvivors);

  if (winningFaction === "tie_all_equal") {
    // All factions completely equal → every surviving player gets 1 token
    for (const survivor of survivors) {
      const { token, remaining } = drawFromBag(newState.honorBag);
      newState = updatePlayer(newState, survivor.playerId, {
        honorTokens: [...getPlayer(newState, survivor.playerId).honorTokens, token],
      });
      newState = { ...newState, honorBag: remaining };
    }
  } else if (winningFaction) {
    // All members of winning faction (including dead) get 1 token
    const winners = state.players.filter((p) => p.factionCard?.faction === winningFaction);
    for (const w of winners) {
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
    const craneRank = craneSorted[i].factionCard!.rank;
    const lotusRank = lotusSorted[i].factionCard!.rank;
    if (craneRank < lotusRank) return "crane"; // lower rank = higher (1 = best)
    if (lotusRank < craneRank) return "lotus";
  }
  // Equal so far — more survivors wins
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
  if (qualifiers.length === 0) {
    return startNewRound(state);
  }

  const maxScore = Math.max(...qualifiers.map((s) => s.score));
  const winners = qualifiers.filter((s) => s.score === maxScore).map((s) => s.playerId);

  return { ...state, phase: "game_over", winners };
}

function startNewRound(state: NinjaGameState): NinjaGameState {
  const ninjaCards = shuffle([...NINJA_CARDS]);
  const factionCards = buildFactionCards(state.players.length);

  const pendingByPlayer: Record<string, typeof NINJA_CARDS> = {};
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
