---
"@washi-ui/core": patch
"@washi-ui/react": patch
---

Fix bouncy scroll sync on iOS by replacing throttle with requestAnimationFrame.

Fix `addComment` throwing on non-secure HTTP contexts (e.g. LAN network hosts) by replacing `crypto.randomUUID()` with a fallback UUID generator.

Fix pin dialog "Add" button not responding to clicks by switching the overlay to view mode as soon as a pin is placed, preventing the annotate-mode overlay from intercepting pointer events while the dialog is open.
