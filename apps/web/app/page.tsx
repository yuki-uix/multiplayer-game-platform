import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-semibold tracking-[0.14em] text-moss uppercase">
          Tablelink
        </span>
        <Link
          href="/game/ninja/rules"
          className="text-sm text-ink/50 hover:text-ink transition-colors"
        >
          规则手册
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">
          多人 · 浏览器 · 零安装
        </p>
        <h1 className="mt-5 text-5xl font-semibold leading-[1.1] sm:text-7xl">
          发一条链接，<br />开一场派对游戏
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/60">
          无需下载任何 App。手机浏览器扫码即进，4–8 人实时互动。
          适合团队团建、线下聚会。
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/game/ninja/new"
            className="inline-flex items-center gap-2 rounded-lg bg-coral px-6 py-3 text-base font-semibold text-white hover:bg-coral/90 transition-colors min-h-[48px]"
          >
            创建游戏房间
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/game/ninja/rules"
            className="inline-flex items-center rounded-lg border border-ink/15 px-6 py-3 text-base text-ink/70 hover:bg-ink/5 transition-colors min-h-[48px]"
          >
            了解玩法
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/40">
            三步开局
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              { step: "01", title: "房主创建房间", desc: "点击按钮，服务器生成专属房间链接" },
              { step: "02", title: "分享给队友", desc: "复制链接或截图，队友手机打开即进" },
              { step: "03", title: "4 人到齐开局", desc: "人满自动进入游戏，无需主持人操作" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-3xl font-semibold text-ink/15">{step}</span>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-ink/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/40">
          当前游戏
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {/* Featured: Night of the Ninja */}
          <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 bg-white p-7 shadow-sm">
            <div className="mb-7 flex h-36 items-center justify-center rounded-xl bg-paper">
              <NinjaIllustration />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">忍者之夜</h3>
                <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-semibold text-moss">
                  可游玩
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                4–8 人隐藏身份派对推理游戏。密探、刺客、骗徒轮番登场，
                活到最后才能带走荣誉。
              </p>
              <div className="mt-5 flex items-center gap-2">
                <Link
                  href="/game/ninja/rules"
                  className="inline-flex items-center rounded-lg border border-ink/15 px-4 py-2 text-sm text-ink/60 hover:bg-ink/5 transition-colors min-h-[40px]"
                >
                  规则
                </Link>
                <Link
                  href="/game/ninja/new"
                  className="inline-flex items-center rounded-lg bg-coral px-5 py-2 text-sm font-semibold text-white hover:bg-coral/90 transition-colors min-h-[40px]"
                >
                  创建房间
                </Link>
              </div>
            </div>
          </article>

          {/* Coming soon */}
          <article className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-7 text-center">
            <span className="text-4xl">🎲</span>
            <h3 className="text-base font-semibold text-ink/40">更多游戏</h3>
            <p className="max-w-[18rem] text-sm leading-relaxed text-ink/35">
              更多派对游戏正在开发中。
            </p>
          </article>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/8 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-xs text-ink/35">
          <span>© 2026 Tablelink</span>
          <span className="hidden sm:block">
            Next.js · Socket.IO · Railway + Vercel
          </span>
        </div>
      </footer>
    </div>
  );
}

function NinjaIllustration() {
  return (
    <div className="flex items-center gap-3">
      {[
        { label: "密探", cls: "bg-sky-100 text-sky-700 -rotate-6" },
        { label: "上忍", cls: "bg-ink/90 text-paper rotate-0 shadow-md" },
        { label: "骗徒", cls: "bg-amber-100 text-amber-700 rotate-6" },
      ].map(({ label, cls }) => (
        <div
          key={label}
          className={`flex h-16 w-11 items-center justify-center rounded-lg border border-ink/10 text-xs font-semibold ${cls}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
