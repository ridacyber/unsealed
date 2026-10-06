// owner: m
import { CheckIcon, EmptyIcon, QuestionIcon } from "@/components/ui/icons";
import type { FieldStatus } from "@/lib/schema";

const BADGES: Record<
  FieldStatus,
  { label: string; className: string; icon: typeof CheckIcon }
> = {
  verified: {
    label: "Verified",
    className: "border-verified bg-verified text-white",
    icon: CheckIcon,
  },
  unsure: {
    label: "Unsure",
    className: "border-unsure-line bg-sheet text-unsure",
    icon: QuestionIcon,
  },
  not_found: {
    label: "Not found",
    className: "border-dashed border-missing-line bg-sheet text-missing",
    icon: EmptyIcon,
  },
};

/**
 * The three states differ by wording, icon, fill and border style, never by
 * colour alone.
 */
export function StatusBadge({ status }: { status: FieldStatus }) {
  const { label, className, icon: BadgeIcon } = BADGES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border py-0.5 pr-2.5 pl-1.5 text-sm font-semibold ${className}`}
    >
      <BadgeIcon width={16} height={16} />
      {label}
    </span>
  );
}
