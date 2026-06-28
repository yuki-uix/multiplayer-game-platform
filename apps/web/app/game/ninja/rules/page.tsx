import { NINJA_CARDS, getCardDescription } from "@mgp/ninja";
import type { NinjaCard } from "@mgp/ninja";
import Link from "next/link";

const PHASE_LABELS: Record<string, string> = {
  spy: "密探阶段",
  hermit: "隐士阶段",
  trickster: "骗徒阶段",
  blind_assassin: "盲眼刺客阶段",
  master_ninja: "上忍阶段",
};

const PHASE_ORDER = ["spy", "hermit", "trickster", "blind_assassin", "master_ninja", null];

function groupCards(cards: NinjaCard[]) {
  const groups: Record<string, NinjaCard[]> = {};
  for (const card of cards) {
    const key = card.phase ?? "__special__";
    groups[key] ??= [];
    groups[key].push(card);
  }
  return PHASE_ORDER.map((phase) => ({
    phase,
    cards: groups[phase ?? "__special__"] ?? [],
  })).filter((g) => g.cards.length > 0);
}

function CardRow({ card }: { card: NinjaCard }) {
  const desc = getCardDescription(card);
  return (
    <div className="flex flex-col gap-1 border-b border-ink/10 py-4 last:border-0">
      <div className="flex items-baseline gap-3">
        <span className="font-semibold">{card.name}</span>
        <span className="text-xs text-moss">{desc.phase}</span>
      </div>
      <p className="text-sm leading-relaxed text-ink/80">{desc.effect}</p>
      <p className="text-xs text-moss">提示：{desc.tip}</p>
    </div>
  );
}

function PhaseSection({ phase, cards }: { phase: string | null; cards: NinjaCard[] }) {
  const label = phase ? PHASE_LABELS[phase] ?? phase : "特殊牌（回合末 / 反应）";

  // For trickster, show each card individually (unique effects)
  // For others, show one representative + count
  const showIndividual = phase === "trickster" || phase === null;
  const displayCards = showIndividual
    ? cards
    : [cards[0]]; // all copies share the same ability

  return (
    <section className="flex flex-col gap-0">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
        {label}
        {!showIndividual && (
          <span className="rounded bg-moss/10 px-2 py-0.5 text-xs font-normal text-moss">
            ×{cards.length} 张，技能相同
          </span>
        )}
      </h2>
      <div className="rounded-xl border border-ink/10 bg-white/60 px-4">
        {displayCards.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

export default function NinjaRulesPage() {
  const groups = groupCards(NINJA_CARDS);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/" className="text-sm text-moss hover:underline">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-semibold">忍者之夜 · 卡牌说明</h1>
          <p className="text-sm leading-relaxed text-ink/60">
            夜晚阶段按密探 → 隐士 → 骗徒 → 盲眼刺客 → 上忍的顺序结算。
            同阶段多人出牌时，按卡牌右下角数字从小到大执行。
          </p>
        </header>

        <section className="rounded-xl border border-ink/10 bg-white/60 px-4 py-3 text-sm leading-relaxed text-ink/70">
          <strong className="text-ink">通用规则：</strong> 即使你持有当前阶段的牌，也可以选择不打出。
          死亡后，本轮剩余忍者牌无法再使用。「查看」只有执行者秘密知道，可如实告知也可隐瞒。
        </section>

        {groups.map(({ phase, cards }) => (
          <PhaseSection key={phase ?? "__special__"} phase={phase} cards={cards} />
        ))}
      </div>
    </main>
  );
}
