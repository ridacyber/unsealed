// owner: m
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "quiet";

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control text-base font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out disabled:cursor-not-allowed";

// A button rises a little under the pointer and settles under the press, so
// the interface shows it heard you. Only an enabled one responds, and the
// movement is left out for reduced motion.
const LIFT =
  "motion-safe:enabled:hover:-translate-y-px motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-[0.97]";

// The secondary button reads its colours from the surface it sits on (see
// globals.css), so it is paper on paper and glass on the midnight desk.
const VARIANTS: Record<Variant, string> = {
  primary: `px-5 bg-postal bg-linear-to-b from-white/12 to-transparent text-white shadow-accent enabled:hover:bg-postal-deep enabled:hover:shadow-accent-raised enabled:active:shadow-accent disabled:bg-line disabled:bg-none disabled:text-ink-soft disabled:shadow-none ${LIFT}`,
  secondary: `px-5 border border-(color:--btn-secondary-border) bg-(--btn-secondary-bg) text-(--btn-secondary-text) shadow-rest enabled:hover:border-(color:--btn-secondary-hover-border) enabled:hover:text-(--btn-secondary-hover-text) enabled:hover:shadow-raised enabled:active:shadow-rest ${LIFT}`,
  quiet:
    "px-2 text-postal underline decoration-postal/40 underline-offset-4 hover:decoration-postal",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
