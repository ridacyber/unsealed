// owner: m
"use client";

import { useEffect, useRef } from "react";

/**
 * Moves keyboard and screen-reader focus to an element when a view appears,
 * so people aren't left stranded where the previous view used to be.
 * The element needs `tabIndex={-1}`.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);

  return ref;
}
