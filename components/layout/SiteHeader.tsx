// owner: m
import { EnvelopeMark } from "@/components/ui/icons";

interface SiteHeaderProps {
  /** When provided, shows a way back to the start. */
  onStartOver?: () => void;
  showDemoTag: boolean;
  /** Match the wider results layout. */
  wide?: boolean;
  /** The surface the header sits on: paper, or the midnight desk. */
  surface?: "paper" | "midnight";
}

const SURFACES = {
  paper: {
    brand: "text-brand-navy",
    startOver:
      "min-h-11 rounded-lg px-3 font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal",
    demoTag:
      "rounded-full border border-line bg-sheet px-3 py-1 text-sm font-semibold text-ink-soft",
  },
  midnight: {
    brand: "text-white",
    startOver:
      "inline-flex min-h-10 items-center rounded-control border border-white/22 px-3.5 font-semibold text-white transition-[transform,border-color,background-color] duration-150 ease-out hover:border-white/50 hover:bg-white/6 motion-safe:active:scale-[0.97]",
    demoTag:
      "rounded-full border border-brand-cyan/35 px-3 py-1.5 text-[0.75rem] font-bold tracking-[0.1em] text-cyan-ink uppercase",
  },
} as const;

export function SiteHeader({
  onStartOver,
  showDemoTag,
  wide = false,
  surface = "paper",
}: SiteHeaderProps) {
  const look = SURFACES[surface];
  // The results and the midnight landing page are both wide layouts.
  const maxWidth = wide || surface === "midnight" ? "max-w-[90rem]" : "max-w-6xl";

  return (
    <header
      className={`mx-auto flex w-full items-center justify-between gap-4 px-5 py-5 sm:px-8 ${maxWidth}`}
    >
      <p
        className={`flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight ${look.brand}`}
      >
        <EnvelopeMark className="neon-glow shrink-0" />
        Unsealed
      </p>

      {onStartOver ? (
        <button type="button" onClick={onStartOver} className={look.startOver}>
          Start over
        </button>
      ) : (
        showDemoTag && <p className={look.demoTag}>Demo build</p>
      )}
    </header>
  );
}
