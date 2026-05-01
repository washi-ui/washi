# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-04-25

### `@washi-ui/core` — v1.0.2

- Fix: replaced the custom `throttle`-based scroll sync with a `requestAnimationFrame` guard — multiple scroll events within a single frame are now coalesced into one overlay transform update, eliminating redundant repaints.
- Fix: `generateId()` fallback for non-secure contexts — `crypto.randomUUID()` is called conditionally; environments that lack it (e.g. plain `http://`) fall back to a `Math.random`-based UUID generator so `addComment` never throws.
- Added four regression tests for the `syncScroll` rAF coalescing behavior.

### `@washi-ui/react` — v1.0.3

- Fix: `WashiPinDialog` now switches to view mode immediately when a pin is placed, so the annotate overlay no longer captures pointer events while the dialog is open.
- Fix: `addComment` errors inside `WashiPinDialog` are now caught and surfaced as an inline error message ("Failed to save comment. Please try again.") rather than propagating as an unhandled rejection.
- Updated to consume `@washi-ui/core@1.0.2`.

### `@washi-ui/adapters` — v1.0.2

- Updated to consume `@washi-ui/core@1.0.2`.

## 2026-03-11

### `@washi-ui/react` — v1.0.2

- Fix: replaced the simple `readyState === 'complete'` check with a `pendingNavigation` guard that detects when `contentDocument` is still `about:blank` but `iframe.src` points to a real URL. Mounting is now deferred to the `load` event so `syncScroll` always attaches to the correct window.
- Added regression test for the `about:blank` + real `src` race condition.
- Added backward-compat test confirming iframes with no `src` still mount immediately.

## 2026-03-08

### `@washi-ui/core` — v1.0.1

- Add `cursor: crosshair` to the overlay element when switching to annotate mode.

### `@washi-ui/react` — v1.0.1

- Updated to consume `@washi-ui/core@1.0.1`.

### `@washi-ui/adapters` — v1.0.1

- Updated to consume `@washi-ui/core@1.0.1`.

## 2026-02-26

Initial stable release.

### `@washi-ui/core` — v1.0.0

- `Washi` class with full pin-based commenting engine
- View and annotate interaction modes
- Transparent overlay mounted on top of iframe content
- Scroll synchronization — pins stay anchored as iframe content scrolls
- Coordinate system — positions stored as 0–100% percentages of content area
- Event system: `pin:placed`, `comment:created`, `comment:updated`, `comment:deleted`, `comment:clicked`, `mode:changed`, `error`
- `addComment(NewComment)` — library generates `id` and `createdAt` automatically
- `updateComment`, `deleteComment`, `getComments`, `setActivePin`, `getCommentIndex`
- Mount options: `readOnly`, `disableBuiltinDialog`
- Adapter pattern — `WashiAdapter` interface for pluggable storage backends
- Full TypeScript support with JSDoc documentation

### `@washi-ui/react` — v1.0.0

- `useWashi` hook — low-level integration with `iframeRef`, mode state, and CRUD methods
- `WashiProvider` — context provider for sharing Washi state across components
- `WashiFrame` — iframe wrapper that auto-registers with the nearest provider
- `WashiUI` — all-in-one floating UI: tool bubble + comments sidebar + pin dialog
- `WashiToolBubble` — floating pill button for toggling annotate mode and the sidebar
- `WashiCommentsSidebar` — slide-in panel with resolve/delete actions per comment
- `WashiPinDialog` — popover that appears on pin placement, handles text input and submission
- `CommentList` — headless list component for rendering comments with custom UI
- `useWashiContext` — access provider state from any descendant component
- All core types re-exported for convenience

### `@washi-ui/adapters` — v1.0.0

- `LocalStorageAdapter` — persists comments to `localStorage`, namespaced by key
- `MemoryAdapter` — in-memory storage with `seed()` helper for tests
