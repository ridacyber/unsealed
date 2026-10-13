// owner: m
import { useId, type ReactNode, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** All icons are decorative; the text beside them carries the meaning. */
function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </Icon>
  );
}

export function QuestionIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.25 7.5a2.75 2.75 0 1 1 4.2 2.35c-.9.55-1.45 1.1-1.45 2.15" />
      <path d="M10 15.25v.01" />
    </Icon>
  );
}

export function EmptyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="6.25" strokeDasharray="2.6 2.6" />
    </Icon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 2.75h6l3.5 3.5v10.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-13.5a.5.5 0 0 1 .5-.5z" />
      <path d="M11.25 3v3.5h3.5M7.5 10.25h5M7.5 13.25h5" />
    </Icon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13V3.75m0 0L6.5 7.25M10 3.75l3.5 3.5" />
      <path d="M3.75 12.5v3a.75.75 0 0 0 .75.75h11a.75.75 0 0 0 .75-.75v-3" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 5.5l9 9m0-9l-9 9" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.25l7.25 12.5H2.75L10 3.25z" />
      <path d="M10 8.5v3.25M10 14v.01" />
    </Icon>
  );
}

export function ChevronIcon({
  direction,
  ...props
}: IconProps & { direction: "left" | "right" | "down" | "up" }) {
  const paths = {
    left: "M12 5l-5 5 5 5",
    right: "M8 5l5 5-5 5",
    down: "M5 8l5 5 5-5",
    up: "M5 12l5-5 5 5",
  };
  return (
    <Icon {...props}>
      <path d={paths[direction]} />
    </Icon>
  );
}

/**
 * The Unsealed mark: an opened envelope with an official letter rising out
 * of it. app/icon.svg is the same drawing, simplified for browser-tab sizes.
 */
export function EnvelopeMark(props: IconProps) {
  // Unique per instance, so two marks on one page keep their own gradients.
  const id = useId();
  const neon = `${id}neon`;
  const front = `${id}front`;

  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient
          id={neon}
          x1="2.5"
          y1="0"
          x2="29.5"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="[stop-color:var(--color-brand-cyan)]" />
          <stop
            offset="0.45"
            className="[stop-color:var(--color-brand-blue)]"
          />
          <stop
            offset="1"
            className="[stop-color:var(--color-brand-violet)]"
          />
        </linearGradient>
        <linearGradient
          id={front}
          x1="8"
          y1="16"
          x2="44"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0.3"
            className="[stop-color:var(--color-brand-navy)]"
          />
          <stop
            offset="1"
            className="[stop-color:var(--color-brand-violet)]"
          />
        </linearGradient>
      </defs>
      {/* The lifted flap, seen behind the letter */}
      <path d="M2.5 14.5L16 4.5l13.5 10V18h-27v-3.5z" fill={`url(#${neon})`} />
      {/* The letter, with two lines of text and its seal */}
      <path
        d="M8.5 4.75A1.75 1.75 0 0 1 10.25 3h11.5a1.75 1.75 0 0 1 1.75 1.75V23h-15V4.75z"
        className="fill-sheet stroke-brand-navy"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 8h8M12 11.5h8"
        className="stroke-brand-blue"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16.25" r="1.6" className="fill-brand-violet" />
      {/* The front of the envelope, its lit opening and its fold lines */}
      <path
        d="M2.5 14.5L16 23l13.5-8.5v12a2 2 0 0 1-2 2h-23a2 2 0 0 1-2-2v-12z"
        fill={`url(#${front})`}
      />
      <path
        d="M3 15.4L16 23.6l13-8.2"
        stroke={`url(#${neon})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.6 27.9l8.8-7.2M28.4 27.9l-8.8-7.2"
        stroke={`url(#${neon})`}
        strokeOpacity="0.55"
        strokeLinecap="round"
      />
    </svg>
  );
}
