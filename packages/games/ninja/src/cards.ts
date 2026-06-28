import type { NinjaCard, NinjaCardKind } from "./types";

export const NINJA_CARDS: NinjaCard[] = [
  // ── Spy (密探) ── 6 cards, same ability
  { id: "spy-1", kind: "spy", phase: "spy", number: 1, name: "密探·壹" },
  { id: "spy-2", kind: "spy", phase: "spy", number: 2, name: "密探·贰" },
  { id: "spy-3", kind: "spy", phase: "spy", number: 3, name: "密探·叁" },
  { id: "spy-4", kind: "spy", phase: "spy", number: 4, name: "密探·肆" },
  { id: "spy-5", kind: "spy", phase: "spy", number: 5, name: "密探·伍" },
  { id: "spy-6", kind: "spy", phase: "spy", number: 6, name: "密探·陆" },

  // ── Mystic (隐士) ── 4 cards, same ability
  { id: "hermit-1", kind: "hermit", phase: "hermit", number: 1, name: "隐士·壹" },
  { id: "hermit-2", kind: "hermit", phase: "hermit", number: 2, name: "隐士·贰" },
  { id: "hermit-3", kind: "hermit", phase: "hermit", number: 3, name: "隐士·叁" },
  { id: "hermit-4", kind: "hermit", phase: "hermit", number: 4, name: "隐士·肆" },

  // ── Trickster (骗徒) ── 6 cards, each unique
  { id: "trickster-1", kind: "trickster", phase: "trickster", number: 1, name: "百变者" },
  { id: "trickster-2", kind: "trickster", phase: "trickster", number: 2, name: "掘墓人" },
  { id: "trickster-3", kind: "trickster", phase: "trickster", number: 3, name: "捣乱者" },
  { id: "trickster-4", kind: "trickster", phase: "trickster", number: 4, name: "灵魂商人" },
  { id: "trickster-5", kind: "trickster", phase: "trickster", number: 5, name: "小偷" },
  { id: "trickster-6", kind: "trickster", phase: "trickster", number: 6, name: "审判者" },

  // ── Blind Assassin (盲眼刺客) ── 5 cards, same ability
  { id: "blind-1", kind: "blind_assassin", phase: "blind_assassin", number: 1, name: "盲眼刺客·壹" },
  { id: "blind-2", kind: "blind_assassin", phase: "blind_assassin", number: 2, name: "盲眼刺客·贰" },
  { id: "blind-3", kind: "blind_assassin", phase: "blind_assassin", number: 3, name: "盲眼刺客·叁" },
  { id: "blind-4", kind: "blind_assassin", phase: "blind_assassin", number: 4, name: "盲眼刺客·肆" },
  { id: "blind-5", kind: "blind_assassin", phase: "blind_assassin", number: 5, name: "盲眼刺客·伍" },

  // ── Shinobi / Master Ninja (上忍) ── 5 cards, same ability
  { id: "master-1", kind: "master_ninja", phase: "master_ninja", number: 1, name: "上忍·壹" },
  { id: "master-2", kind: "master_ninja", phase: "master_ninja", number: 2, name: "上忍·贰" },
  { id: "master-3", kind: "master_ninja", phase: "master_ninja", number: 3, name: "上忍·叁" },
  { id: "master-4", kind: "master_ninja", phase: "master_ninja", number: 4, name: "上忍·肆" },
  { id: "master-5", kind: "master_ninja", phase: "master_ninja", number: 5, name: "上忍·伍" },

  // ── Reaction cards ── phase=null
  // martyr = Mirror Monk (镜僧): counter-kills attacker
  { id: "martyr-1", kind: "martyr", phase: null, number: 1, name: "镜僧·壹" },
  { id: "martyr-2", kind: "martyr", phase: null, number: 2, name: "镜僧·贰" },
  // redirector = Martyr (殉道者): you die but gain an Honor Token
  { id: "redirector-1", kind: "redirector", phase: null, number: 1, name: "殉道者·壹" },
  { id: "redirector-2", kind: "redirector", phase: null, number: 2, name: "殉道者·贰" },

  // ── Mastermind / Boss (幕后主使) ── revealed at round end if alive
  { id: "boss-1", kind: "boss", phase: null, number: 1, name: "幕后主使·壹" },
  { id: "boss-2", kind: "boss", phase: null, number: 2, name: "幕后主使·贰" },
  { id: "boss-3", kind: "boss", phase: null, number: 3, name: "幕后主使·叁" },
];

// ── Card descriptions ─────────────────────────────────────────────────────────

export type CardDescription = {
  title: string;
  phase: string;
  effect: string;
  tip: string;
};

/** Per-card descriptions keyed by card id (for unique trickster cards) */
export const CARD_DESCRIPTIONS_BY_ID: Partial<Record<string, CardDescription>> = {
  "trickster-1": {
    title: "百变者",
    phase: "骗徒阶段",
    effect: "查看任意两名玩家的 House 牌，然后可以秘密交换这两张 House 牌的位置。",
    tip: "被交换的玩家不会知道自己的阵营变了，除非之后有人再查看他们。",
  },
  "trickster-2": {
    title: "掘墓人",
    phase: "骗徒阶段",
    effect: "查看弃牌区中的两张忍者牌，选择其中一张为自己使用（立刻打出或留到对应阶段）。",
    tip: "可以从弃牌堆捡回杀牌或反应牌，让已消耗的威胁重新出现。",
  },
  "trickster-3": {
    title: "捣乱者",
    phase: "骗徒阶段",
    effect: "选择一名玩家，公开他的 House 牌，全桌可见。",
    tip: "让所有人知道目标的阵营，逼迫站队，或为后续刺杀提供方向。",
  },
  "trickster-4": {
    title: "灵魂商人",
    phase: "骗徒阶段",
    effect: "查看另一名玩家的一枚 Honor Token 或 House 牌，然后可以与该玩家交换一枚 Honor Token。",
    tip: "后期强牌。既能获取情报，又能偷走高分标记。",
  },
  "trickster-5": {
    title: "小偷",
    phase: "骗徒阶段",
    effect: "公开自己的 House 牌。如果有玩家持有的 Honor Token 数量比你多，从其中一名玩家那里拿走一枚。",
    tip: "落后时追分利器。胜利在回合末统一检查，不会因为超过 10 分立刻触发。",
  },
  "trickster-6": {
    title: "审判者",
    phase: "骗徒阶段",
    effect: "选择一名玩家，将其击杀。此击杀绕过镜僧和殉道者的反应效果。",
    tip: "比盲眼刺客和上忍更早出手，且无法被反应牌化解。",
  },
};

/** Fallback descriptions keyed by card kind (for cards where all copies share the same ability) */
export const CARD_DESCRIPTIONS_BY_KIND: Record<NinjaCardKind, CardDescription> = {
  spy: {
    title: "密探",
    phase: "密探阶段",
    effect: "选择一名玩家，秘密查看他的 House 牌（阵营）。",
    tip: "你可以如实告知、隐瞒或误导其他人。不能查看忍者牌，也不改变任何牌的位置。",
  },
  hermit: {
    title: "隐士",
    phase: "隐士阶段",
    effect: "选择一名玩家，查看他的 House 牌，并随机查看他的一张忍者牌。",
    tip: "比密探多看一张忍者牌，可以推断对方之后是否会刺杀或反制。",
  },
  trickster: {
    title: "骗徒",
    phase: "骗徒阶段",
    effect: "每张骗徒牌技能各不相同，详见具体卡名。",
    tip: "骗徒是全游戏信息雾最浓的一组，每张都有独立效果。",
  },
  blind_assassin: {
    title: "盲眼刺客",
    phase: "盲眼刺客阶段",
    effect: "选择一名玩家，直接尝试将其击杀，不查看对方阵营。",
    tip: "高风险高回报。适合在已有情报的情况下使用，否则可能误杀同伴。",
  },
  master_ninja: {
    title: "上忍",
    phase: "上忍阶段",
    effect: "选择一名玩家，先查看他的 House 牌，然后自行决定是否将其击杀。",
    tip: "比盲眼刺客更安全，可以在确认身份后再决定是否出手。",
  },
  martyr: {
    title: "镜僧（反应牌）",
    phase: "响应盲眼刺客或上忍的刺杀",
    effect: "当你被盲眼刺客或上忍选为击杀目标时，公开此牌，攻击者被击杀，你安然无恙。",
    tip: "不能响应审判者（骗徒·6）的击杀。",
  },
  redirector: {
    title: "还击者（反应牌）",
    phase: "响应盲眼刺客或上忍的刺杀",
    effect: "当你被盲眼刺客或上忍选为击杀目标时，公开此牌，将击杀重定向到另一名你指定的玩家，你安然无恙。",
    tip: "把刀借刀杀人。注意不能将攻击重定向给已死亡的玩家。",
  },
  boss: {
    title: "幕后主使",
    phase: "回合末",
    effect: "如果你活到回合末，公开此牌，你的 House 赢得本轮（无论排名）。",
    tip: "你的首要任务是活下去。若你是浪人且存活，其他阵营无法因 House 胜利得分。",
  },
};

export function getCardDescription(card: NinjaCard): CardDescription {
  return (
    CARD_DESCRIPTIONS_BY_ID[card.id] ?? CARD_DESCRIPTIONS_BY_KIND[card.kind]
  );
}

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
];
