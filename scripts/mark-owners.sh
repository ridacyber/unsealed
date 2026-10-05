#!/bin/bash
# Adds an "owner: m|r" header to the first line of each file. Safe to re-run.
mark() {
  f="$2"; [ -f "$f" ] || return
  case "$f" in
    *.ts|*.tsx|*.js|*.mjs) c="// owner: $1" ;;
    *.css) c="/* owner: $1 */" ;;
    *.md) c="<!-- owner: $1 -->" ;;
    *) return ;;   # json, csv, txt, svg, .env: can't hold comments, see OWNERS.md
  esac
  head -n 1 "$f" | grep -q "owner:" && return
  { echo "$c"; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
}

# m = frontend (partner)
for f in app/page.tsx app/layout.tsx app/globals.css; do mark m "$f"; done
find app/results components samples -type f 2>/dev/null | while read -r f; do mark m "$f"; done

# r = backend (you)
find app/api lib scripts -type f 2>/dev/null | while read -r f; do mark r "$f"; done
find eval -maxdepth 1 -type f 2>/dev/null | while read -r f; do mark r "$f"; done
mark r FEEDBACK.md
