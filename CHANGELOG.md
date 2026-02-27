# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-26

Initial stable release.

### `@washi-ui/core`

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

### `@washi-ui/react`

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

### `@washi-ui/adapters`

- `LocalStorageAdapter` — persists comments to `localStorage`, namespaced by key
- `MemoryAdapter` — in-memory storage with `seed()` helper for tests

[Unreleased]: https://github.com/washi-ui/washi/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/washi-ui/washi/releases/tag/v1.0.0
