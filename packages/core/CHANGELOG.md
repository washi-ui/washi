# @washi-ui/core

## 1.0.2

### Patch Changes

- 664932b: Fix bouncy scroll sync on iOS by replacing throttle with requestAnimationFrame.

  Fix `addComment` throwing on non-secure HTTP contexts (e.g. LAN network hosts) by replacing `crypto.randomUUID()` with a fallback UUID generator.

  Fix pin dialog "Add" button not responding to clicks by switching the overlay to view mode as soon as a pin is placed, preventing the annotate-mode overlay from intercepting pointer events while the dialog is open.

## 1.0.1

### Patch Changes

- 325ce63: Add `cursor: crosshair` to the overlay element when switching to annotate
