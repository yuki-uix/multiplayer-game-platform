import Link from "next/link";

type GameCardProps = {
  title: string;
  description: string;
  href: string;
  rulesHref?: string;
};

export function GameCard({ title, description, href, rulesHref }: GameCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-paper">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              className="h-3 w-3 rounded-full bg-ink/20 data-[stone=black]:bg-ink data-[stone=white]:border data-[stone=white]:border-ink/30 data-[stone=white]:bg-white"
              data-stone={index === 6 || index === 12 || index === 18 ? "black" : index === 8 || index === 16 ? "white" : "empty"}
              key={index}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {rulesHref && (
            <Link
              className="rounded-md border border-ink/15 px-3 py-2 text-sm text-ink/60 transition hover:bg-ink/5"
              href={rulesHref}
            >
              规则
            </Link>
          )}
          <Link
            className="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90"
            href={href}
          >
            Create Room
          </Link>
        </div>
      </div>
    </article>
  );
}
