// owner: m
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "quiet";

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold transition-colors disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "px-5 bg-postal text-white hover:bg-postal-deep disabled:bg-line disabled:text-ink-soft",
  secondary:
    "px-5 border border-ink/25 bg-sheet text-ink hover:border-ink/60 hover:bg-paper",
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
