// owner: m
"use client";

import { useEffect, useRef } from "react";

/**
 * Says why a dropped file wasn't opened, on the waiting and failure screens.
 * It takes its place in the page after the controls, rather than floating
 * over them, so it can never cover Cancel or the other buttons, whatever the
 * window's height. If it lands out of view, the page moves just enough to
 * show it. Always present and empty until needed, so the message is
 * announced when it appears.
 */
export function DropNote({ on, children }: { on: boolean; children: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: "nearest" });
  }, [on]);

  return (
    <div ref={ref} role="status" className="pw-drop-note" data-on={on ? "" : undefined}>
      {on && children}
    </div>
  );
}
