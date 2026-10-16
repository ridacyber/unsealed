// owner: m
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

/** The footer's colours follow the page it ends; see .site-footer in globals.css. */
export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-sm sm:px-8 md:flex-row md:items-start md:justify-between md:gap-10">
        <p className="max-w-2xl">
          Unsealed helps you read a letter. It isn&rsquo;t legal or financial
          advice, and it&rsquo;s no substitute for the letter itself. If
          something matters, check it against the original or ask the sender.
        </p>

        <nav aria-label="Legal" className="shrink-0">
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
