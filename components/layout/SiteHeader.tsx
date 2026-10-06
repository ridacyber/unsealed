// owner: m
import { EnvelopeMark } from "@/components/ui/icons";

interface SiteHeaderProps {
  /** When provided, shows a way back to the start. */
  onStartOver?: () => void;
  showDemoTag: boolean;
  /** Match the wider results layout. */
  wide?: boolean;
}

export function SiteHeader({
  onStartOver,
  showDemoTag,
  wide = false,
}: SiteHeaderProps) {
  return (
    <header
      className={`mx-auto flex w-full items-center justify-between gap-4 px-5 py-5 sm:px-8 ${
        wide ? "max-w-[90rem]" : "max-w-6xl"
      }`}
    >
      <p className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
        <EnvelopeMark className="text-postal" />
        Unsealed
      </p>

      {onStartOver ? (
        <button
          type="button"
          onClick={onStartOver}
          className="min-h-11 rounded-lg px-3 font-semibold text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal"
        >
          Start over
        </button>
      ) : (
        showDemoTag && (
          <p className="rounded-full border border-line bg-sheet px-3 py-1 text-sm font-semibold text-ink-soft">
            Demo build
          </p>
        )
      )}
    </header>
  );
}
