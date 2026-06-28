"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { socket } from "../../lib/socket";
import { getOrCreatePlayer } from "../../lib/player";
import { useRoomStore } from "../../store/room-store";
import { getCardDescription } from "@mgp/ninja";
import type { NinjaPublicState, NinjaPublicPlayerView, NinjaCard, NightPhase } from "@mgp/ninja";
import type { Player } from "@mgp/shared";

// ── Phase labels ──────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<NightPhase, string> = {
  spy: "密探",
  hermit: "隐士",
  trickster: "骗徒",
  blind_assassin: "盲眼刺客",
  master_ninja: "上忍",
};

// ── Kill cards that require a target ────────────────────────────────────────

const KILL_CARD_IDS = new Set(["trickster-6"]);

function requiresTarget(card: NinjaCard): boolean {
  return card.kind === "blind_assassin" || card.kind === "master_ninja" || KILL_CARD_IDS.has(card.id);
}

// ── Main component ────────────────────────────────────────────────────────────

type NinjaRoomProps = { roomId: string };

export function NinjaRoom({ roomId }: NinjaRoomProps) {
  const router = useRouter();
  const isNew = roomId === "new";
  const initialized = useRef(false);

  const { connection, room, me, setConnection, setRoom, setMe } = useRoomStore();
  const [gameState, setGameState] = useState<NinjaPublicState | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const player = getOrCreatePlayer();
    setMe(player);
    setConnection("connecting");
    socket.connect();

    socket.on("connect", () => {
      setConnection("connected");
      if (isNew) {
        socket.emit("client:room:create", { game: "ninja" }, ({ roomId: newId }: { roomId: string }) => {
          router.replace(`/game/ninja/${newId}`);
        });
      } else {
        socket.emit("client:room:join", { roomId, player }, ({ ok }: { ok: boolean }) => {
          if (!ok) router.replace("/");
        });
      }
    });

    socket.on("server:room:state", ({ room: r }) => setRoom(r));
    socket.on("server:room:created", ({ room: r }) => setRoom(r));
    socket.on("server:room:joined", ({ room: r }) => setRoom(r));
    socket.on("server:game:state", ({ state }) => setGameState(state as NinjaPublicState));
    socket.on("server:error", ({ message }) => console.error("Server error:", message));

    return () => {
      initialized.current = false;
      if (!isNew && room) {
        socket.emit("client:room:leave", { roomId, playerId: player.id });
      }
      socket.removeAllListeners();
      socket.disconnect();
      setConnection("disconnected");
      setGameState(null);
    };
  }, []);

  function sendAction(action: unknown) {
    if (!me) return;
    socket.emit("client:game:action", { roomId: room?.id ?? roomId, action, playerId: me.id });
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  const players = room?.players ?? [];
  const isWaiting = !room || room.status === "waiting";

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">

        {/* ── Main panel ──────────────────────────────────────────────── */}
        <div className="min-w-0 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">忍者之夜</p>
              <h1 className="mt-1 text-3xl font-semibold">
                {isNew ? "Creating room…" : `Room ${roomId}`}
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/game/ninja/rules"
                className="inline-flex items-center rounded-md border border-ink/15 px-3 py-2 text-sm text-ink/60 hover:bg-ink/5 min-h-[44px]"
              >
                规则
              </Link>
              {!isNew && (
                <button
                  onClick={copyLink}
                  className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-semibold min-h-[44px]"
                >
                  复制邀请链接
                </button>
              )}
            </div>
          </div>

          {/* Phase content */}
          {isWaiting && !isNew && (
            <WaitingPanel playerCount={players.length} />
          )}
          {gameState && me && (
            <GamePanel
              state={gameState}
              me={me}
              players={players}
              onAction={sendAction}
            />
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="order-first lg:order-last rounded-lg border border-ink/10 bg-white p-5 shadow-sm self-start">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">玩家</h2>
            <span className="text-xs text-ink/40">
              {connection === "connected" ? "● 在线" : "○ 连接中"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {players.length === 0 ? (
              <p className="text-sm text-ink/40">等待玩家加入…</p>
            ) : (
              players.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  isMe={p.id === me?.id}
                  gameView={gameState?.players.find((gp) => gp.playerId === p.id)}
                />
              ))
            )}
          </div>
          {isWaiting && players.length < 4 && !isNew && (
            <p className="mt-4 text-xs text-ink/40">至少需要 4 名玩家才能开始</p>
          )}
        </aside>
      </div>
    </main>
  );
}

// ── Waiting ───────────────────────────────────────────────────────────────────

function WaitingPanel({ playerCount }: { playerCount: number }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white px-5 py-6 text-center text-ink/60">
      <p className="text-lg font-medium">等待玩家加入</p>
      <p className="mt-1 text-sm">
        已加入 {playerCount} / 4（最少）人，分享链接邀请队友
      </p>
    </div>
  );
}

// ── Game panel (routes by phase) ─────────────────────────────────────────────

function GamePanel({
  state,
  me,
  players,
  onAction,
}: {
  state: NinjaPublicState;
  me: Player;
  players: Player[];
  onAction: (action: unknown) => void;
}) {
  const alivePlayers = state.players.filter((p) => p.alive && p.playerId !== me.id);

  if (state.phase === "draft") {
    return (
      <DraftPanel
        state={state}
        onAction={onAction}
      />
    );
  }

  if (state.phase === "night") {
    return (
      <NightPanel
        state={state}
        myId={me.id}
        alivePlayers={alivePlayers}
        allPlayers={players}
        onAction={onAction}
      />
    );
  }

  if (state.phase === "reveal" || state.phase === "round_end") {
    return <RevealPanel state={state} allPlayers={players} />;
  }

  if (state.phase === "game_over") {
    return <GameOverPanel state={state} allPlayers={players} myId={me.id} />;
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white px-5 py-6 text-sm text-ink/50">
      阶段：{state.phase}
    </div>
  );
}

// ── Draft phase ───────────────────────────────────────────────────────────────

function DraftPanel({ state, onAction }: { state: NinjaPublicState; onAction: (a: unknown) => void }) {
  const options = state.myDraftOptions;
  const hasPicked = !options || options.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-ink/10 bg-white px-5 py-4">
        <p className="text-sm font-semibold text-moss">第 {state.round} 轮 · 选牌阶段</p>
        {hasPicked ? (
          <p className="mt-2 text-ink/60 text-sm">
            已选牌，等待其他玩家（{state.draftPendingCount} 人）…
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink/70">从以下牌中选择一张加入手牌：</p>
        )}
      </div>

      {!hasPicked && (
        <div className="grid gap-3 sm:grid-cols-3">
          {options!.map((card) => (
            <CardButton
              key={card.id}
              card={card}
              onClick={() => onAction({ type: "draft_pick", cardId: card.id })}
            />
          ))}
        </div>
      )}

      {/* Current hand */}
      {(state.myHand ?? []).length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">我的手牌</p>
          <div className="flex gap-3 flex-wrap">
            {state.myHand.map((card) => (
              <CardChip key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Night phase ───────────────────────────────────────────────────────────────

function NightPanel({
  state,
  myId,
  alivePlayers,
  allPlayers,
  onAction,
}: {
  state: NinjaPublicState;
  myId: string;
  alivePlayers: NinjaPublicPlayerView[];
  allPlayers: Player[];
  onAction: (a: unknown) => void;
}) {
  const [selectedCard, setSelectedCard] = useState<NinjaCard | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const currentPhase = state.currentNightPhase;
  const myHand = state.myHand ?? [];
  const myCards = myHand.filter((c) => c.phase === currentPhase);
  const meAsPlayer = state.players.find((p) => p.playerId === myId);
  const isDead = meAsPlayer ? !meAsPlayer.alive : false;
  const pendingReaction = state.pendingReaction;
  const iAmTarget = pendingReaction?.targetId === myId;

  function playCard() {
    if (!selectedCard) return;
    const action: Record<string, unknown> = { type: "night_play", cardId: selectedCard.id };
    if (requiresTarget(selectedCard)) {
      if (!selectedTarget) return;
      action.targetPlayerId = selectedTarget;
    }
    onAction(action);
    setSelectedCard(null);
    setSelectedTarget(null);
  }

  function pass() {
    onAction({ type: "night_pass" });
    setSelectedCard(null);
    setSelectedTarget(null);
  }

  const needsTarget = selectedCard && requiresTarget(selectedCard);
  const canPlay = selectedCard && (!needsTarget || selectedTarget);

  // Reaction window: game is paused until target responds
  if (pendingReaction) {
    const attackerName = allPlayers.find((p) => p.id === pendingReaction.attackerId)?.displayName ?? "某人";
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-xl border px-5 py-5 ${iAmTarget ? "border-coral/40 bg-coral/5" : "border-ink/10 bg-white"}`}>
          <p className="font-semibold">
            {iAmTarget ? "你被锁定为击杀目标！" : `等待 ${attackerName} 的目标做出反应…`}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {iAmTarget
              ? `${attackerName} 对你出了刺杀牌。反应牌功能尚未开放，点击继续即跳过。`
              : "本轮行动暂停，等待结果公布。"}
          </p>
          {iAmTarget && (
            <button
              onClick={() => onAction({ type: "night_pass" })}
              className="mt-4 rounded-md bg-coral px-5 py-2 text-sm font-semibold text-white min-h-[44px]"
            >
              继续（跳过反应）
            </button>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">我的手牌</p>
          <div className="flex gap-3 flex-wrap">
            {myHand.map((card) => (
              <CardChip key={card.id} card={card} dimmed />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Phase indicator */}
      <div className="flex gap-2 flex-wrap">
        {(["spy", "hermit", "trickster", "blind_assassin", "master_ninja"] as NightPhase[]).map((ph) => (
          <span
            key={ph}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              ph === currentPhase
                ? "bg-ink text-paper"
                : "bg-ink/8 text-ink/40"
            }`}
          >
            {PHASE_LABELS[ph]}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white px-5 py-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-moss">
          第 {state.round} 轮 · {currentPhase ? PHASE_LABELS[currentPhase] : ""}阶段
        </p>

        {isDead ? (
          <p className="text-sm text-ink/50">你已淘汰，本阶段无法行动。</p>
        ) : myCards.length === 0 ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-ink/60 flex-1">本阶段无匹配手牌。</p>
            <button
              onClick={pass}
              className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5 min-h-[44px]"
            >
              Pass
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink/70">选择一张牌打出，或直接 Pass：</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap">
              {myCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCard(card);
                    setSelectedTarget(null);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition min-h-[56px] ${
                    selectedCard?.id === card.id
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 bg-paper hover:bg-ink/5"
                  }`}
                >
                  <div className="font-semibold">{card.name}</div>
                  <div className="mt-0.5 text-xs opacity-70">{getCardDescription(card).effect.slice(0, 40)}…</div>
                </button>
              ))}
            </div>

            {/* Target selector */}
            {needsTarget && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink/50">选择目标：</p>
                <div className="flex gap-2 flex-wrap">
                  {alivePlayers.map((p) => {
                    const name = allPlayers.find((ap) => ap.id === p.playerId)?.displayName ?? p.playerId;
                    return (
                      <button
                        key={p.playerId}
                        onClick={() => setSelectedTarget(p.playerId)}
                        className={`rounded-md border px-3 py-2 text-sm transition min-h-[44px] ${
                          selectedTarget === p.playerId
                            ? "border-coral bg-coral text-white"
                            : "border-ink/15 bg-paper hover:bg-ink/5"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={playCard}
                disabled={!canPlay}
                className="rounded-md bg-ink px-5 py-2 text-sm font-semibold text-paper disabled:opacity-40 min-h-[44px]"
              >
                打出
              </button>
              <button
                onClick={pass}
                className="rounded-md border border-ink/15 px-4 py-2 text-sm text-ink/60 hover:bg-ink/5 min-h-[44px]"
              >
                Pass
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hand overview */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">我的手牌</p>
        <div className="flex gap-3 flex-wrap">
          {myHand.map((card) => (
            <CardChip key={card.id} card={card} dimmed={card.phase !== currentPhase} />
          ))}
          {state.myHand.length === 0 && (
            <span className="text-sm text-ink/40">已出完所有手牌</span>
          )}
        </div>
      </div>

      {/* My faction */}
      {state.myFactionCard && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink/40">我的阵营：</span>
          <FactionBadge faction={state.myFactionCard.faction} rank={state.myFactionCard.rank} />
        </div>
      )}
    </div>
  );
}

// ── Reveal phase ──────────────────────────────────────────────────────────────

function RevealPanel({ state, allPlayers }: { state: NinjaPublicState; allPlayers: Player[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-ink/10 bg-white px-5 py-4">
        <p className="text-sm font-semibold text-moss">
          第 {state.round} 轮 · {state.phase === "reveal" ? "翻牌公示" : "本轮结束"}
        </p>
        <p className="mt-1 text-sm text-ink/60">阵营揭示，荣誉结算中…</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {state.players.map((p) => {
          const name = allPlayers.find((ap) => ap.id === p.playerId)?.displayName ?? p.playerId;
          return (
            <div
              key={p.playerId}
              className={`rounded-xl border px-4 py-3 ${p.alive ? "border-ink/10 bg-white" : "border-ink/5 bg-ink/3 opacity-50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{name}</span>
                {!p.alive && <span className="text-xs text-ink/40">已淘汰</span>}
              </div>
              {p.factionCard ? (
                <FactionBadge faction={p.factionCard.faction} rank={p.factionCard.rank} />
              ) : (
                <span className="text-xs text-ink/40">阵营未知</span>
              )}
              <div className="mt-1 text-xs text-ink/50">荣誉：{p.honorTokenCount} 枚</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Game over ─────────────────────────────────────────────────────────────────

function GameOverPanel({
  state,
  allPlayers,
  myId,
}: {
  state: NinjaPublicState;
  allPlayers: Player[];
  myId: string;
}) {
  const winnerNames = (state.winners ?? []).map(
    (id) => allPlayers.find((p) => p.id === id)?.displayName ?? id,
  );
  const iWon = state.winners?.includes(myId);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-ink/10 bg-white px-5 py-6 text-center">
        <p className="text-2xl font-bold">{iWon ? "🎉 你赢了！" : "游戏结束"}</p>
        {winnerNames.length > 0 && (
          <p className="mt-2 text-ink/60">
            获胜者：{winnerNames.join("、")}
          </p>
        )}
        <Link
          href="/"
          className="mt-5 inline-block rounded-md bg-coral px-6 py-2 text-sm font-semibold text-white"
        >
          返回首页
        </Link>
      </div>
      <RevealPanel state={state} allPlayers={allPlayers} />
    </div>
  );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function CardButton({ card, onClick }: { card: NinjaCard; onClick: () => void }) {
  const desc = getCardDescription(card);
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-ink/15 bg-white p-4 text-left hover:border-ink/40 hover:shadow-sm transition"
    >
      <div className="font-semibold text-sm">{card.name}</div>
      <div className="mt-1 text-xs text-ink/60 leading-relaxed">{desc.effect}</div>
    </button>
  );
}

function CardChip({ card, dimmed = false }: { card: NinjaCard; dimmed?: boolean }) {
  const desc = getCardDescription(card);
  return (
    <span
      title={desc.effect}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
        dimmed ? "border-ink/10 text-ink/30" : "border-ink/20 text-ink/70"
      }`}
    >
      {card.name}
    </span>
  );
}

function FactionBadge({ faction, rank }: { faction: string; rank?: number }) {
  const labels: Record<string, string> = { crane: "鹤派", lotus: "莲花派", ronin: "浪人" };
  const colors: Record<string, string> = {
    crane: "bg-sky-100 text-sky-700",
    lotus: "bg-pink-100 text-pink-700",
    ronin: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${colors[faction] ?? "bg-ink/10 text-ink"}`}>
      {labels[faction] ?? faction}{rank ? ` · ${rank}` : ""}
    </span>
  );
}

function PlayerRow({
  player,
  isMe,
  gameView,
}: {
  player: Player;
  isMe: boolean;
  gameView?: NinjaPublicPlayerView;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${gameView ? (gameView.alive ? "bg-moss" : "bg-ink/20") : "bg-ink/20"}`}
        />
        <span className="text-sm truncate">
          {player.displayName}
          {isMe && <span className="ml-1 text-xs text-ink/40">(你)</span>}
        </span>
      </div>
      {gameView && (
        <span className="text-xs text-ink/40 flex-shrink-0">
          {gameView.alive ? `${gameView.honorTokenCount} 荣誉` : "已淘汰"}
        </span>
      )}
    </div>
  );
}
