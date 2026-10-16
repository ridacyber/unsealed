// owner: m

/**
 * The little envelope in the drop zone. Its letter stands half out while the
 * zone is empty, lifts when a file is held over the page, slides in when one
 * is chosen (the flap closes and a postmark lands), and is pushed back out,
 * in red, when the file can't be used. Decoration: the words beside it say
 * what happened. The state comes from the nearest `[data-state]` around it;
 * see .drop-slot in globals.css.
 */
export function DropSlot({ large = false }: { large?: boolean }) {
  return (
    <div className={`drop-slot ${large ? "drop-slot-large" : ""}`} aria-hidden="true">
      <span className="drop-slot-back" />
      <span className="drop-slot-flap-open" />
      <span className="drop-slot-sheet">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="drop-slot-front" />
      <span className="drop-slot-flap-shut" />
      <span className="drop-slot-stamp">
        <svg viewBox="0 0 20 20" width="14" height="14" focusable="false">
          <path
            d="M4.5 10.5l3.5 3.5 7.5-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
