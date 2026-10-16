// owner: m

/**
 * The letter on the desk, seen from the back: sealed, with the file's name on
 * a label. While a letter is being read, a slow light passes over it; when it
 * comes back without results, it lies a little askew with a "Returned" stamp.
 *
 * Decoration only: the words on the page say what is happening, and the name
 * on the label repeats the one given beside it. Nothing here moves in a way
 * that could be read as progress.
 */
export function SealedLetter({
  fileName,
  returned = false,
  tone,
}: {
  fileName: string;
  returned?: boolean;
  /** The stamp's colour on a returned letter. */
  tone?: "temporary" | "file" | "service";
}) {
  return (
    <div
      aria-hidden="true"
      className="pw-letter"
      data-returned={returned ? "" : undefined}
      data-tone={returned ? tone : undefined}
    >
      <div className="pw-envelope">
        <span className="pw-fold pw-fold-left" />
        <span className="pw-fold pw-fold-right" />
        <span className="pw-fold pw-fold-bottom" />
        <span className="pw-flap" />
        {!returned && <span className="pw-sheen" />}
      </div>
      <span className="pw-seal">
        <span className="pw-seal-mark">U</span>
      </span>
      <span className="pw-label">
        <span className="pw-label-name">{fileName}</span>
      </span>
      {returned && <span className="pw-stamp">Returned</span>}
    </div>
  );
}
