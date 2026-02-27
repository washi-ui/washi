# @washi-ui/core

Framework-agnostic HTML commenting engine. Mount an annotation layer on top of any iframe, handle pin-based comments, and delegate storage to any backend via the adapter pattern.

## Installation

```bash
npm install @washi-ui/core
```

## Quick Start

```typescript
import { Washi } from '@washi-ui/core';

// 1. Implement a storage adapter
const adapter = {
  async save(comment) {
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
  },
  async load() {
    return fetch('/api/comments').then(r => r.json());
  },
  async update(id, updates) {
    await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },
  async delete(id) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
  },
};

// 2. Create and mount
const washi = new Washi(adapter);
await washi.mount(document.querySelector('iframe'));

// 3. Handle events
washi.on('pin:placed', async ({ x, y }) => {
  // User clicked the overlay in annotate mode
  // Show your comment input, then call addComment
  const text = prompt('Comment:');
  if (text) await washi.addComment({ x, y, text });
});

washi.on('comment:clicked', ({ comment }) => {
  console.log('Pin clicked:', comment.text);
});

// 4. Enable annotate mode
washi.setMode('annotate');
```

---

## API Reference

### `new Washi(adapter)`

Creates a Washi instance. The adapter handles all storage — it is not called until `mount()` is called.

```typescript
const washi = new Washi(adapter);
```

---

### `washi.mount(iframe, options?)`

Mounts the annotation layer onto an iframe. Async — loads existing comments from the adapter and waits for iframe content dimensions to stabilise before rendering pins.

```typescript
await washi.mount(document.querySelector('iframe'));

// With options
await washi.mount(iframe, {
  readOnly: true,             // Disable annotate mode
  disableBuiltinDialog: true, // Suppress built-in click popover
});
```

**MountOptions**

| Option | Type | Description |
|--------|------|-------------|
| `readOnly` | `boolean` | Prevents switching to annotate mode |
| `disableBuiltinDialog` | `boolean` | Suppresses the built-in pin popover on click. Use when rendering your own popover via `comment:clicked`. |

Throws if the iframe is already mounted (call `unmount()` first) or not attached to the DOM.

---

### `washi.unmount()`

Removes the overlay, cleans up all event listeners, and clears internal state. Safe to call multiple times.

```typescript
washi.unmount();
// Can now mount to a different iframe
await washi.mount(otherIframe);
```

---

### `washi.setMode(mode)`

Switches between interaction modes. Emits `mode:changed`.

| Mode | Behaviour |
|------|-----------|
| `'view'` | Overlay has no pointer events; existing pins are clickable |
| `'annotate'` | Overlay captures clicks and emits `pin:placed` with `{ x, y }` coordinates |

```typescript
washi.setMode('annotate');
washi.setMode('view');
```

Throws if `readOnly` was set in mount options and mode is `'annotate'`.

---

### `washi.addComment(input)`

Adds a comment and renders its pin on the overlay. The library generates `id` and `createdAt` — you only need to provide `x`, `y`, and `text`.

```typescript
const comment = await washi.addComment({
  x: 42.5,           // 0–100, percentage of content width
  y: 18.0,           // 0–100, percentage of content height
  text: 'This heading needs more contrast',
  color: '#ef4444',  // optional, defaults to palette
});

console.log(comment.id);        // auto-generated UUID
console.log(comment.createdAt); // auto-generated timestamp
```

Emits `comment:created` with the full `Comment` on success.

---

### `washi.updateComment(id, updates)`

Updates a comment with partial data. Re-renders the pin if `x`, `y`, `color`, or `resolved` changes.

```typescript
await washi.updateComment('abc', { resolved: true });
await washi.updateComment('abc', { x: 60, y: 30 });
await washi.updateComment('abc', { color: '#10b981' });
```

Emits `comment:updated` with `{ id, updates }`.

---

### `washi.deleteComment(id)`

Deletes a comment and removes its pin. Re-renders remaining pins to update their numbered badges.

```typescript
await washi.deleteComment('abc');
```

Emits `comment:deleted` with `{ id }`.

---

### `washi.getComments()`

Returns a snapshot of all current comments as shallow copies.

```typescript
const all = washi.getComments();
const unresolved = washi.getComments().filter(c => !c.resolved);
```

---

### `washi.on(event, handler)`

Subscribes to an event. Returns an unsubscribe function.

```typescript
const off = washi.on('comment:created', (comment) => {
  console.log('New comment:', comment.id);
});

// Unsubscribe later
off();
```

---

## Events

| Event | Payload type | When |
|-------|-------------|------|
| `pin:placed` | `PinPlacedEvent` | User clicked the overlay in annotate mode |
| `comment:created` | `Comment` | `addComment()` succeeded and comment was persisted |
| `comment:updated` | `CommentUpdatedEvent` | `updateComment()` succeeded |
| `comment:deleted` | `CommentDeletedEvent` | `deleteComment()` succeeded |
| `comment:clicked` | `CommentClickedEvent` | User clicked an existing pin |
| `mode:changed` | `ModeChangedEvent` | `setMode()` was called |
| `error` | `ErrorEvent` | An internal load/save error occurred |

---

## Types

### `WashiAdapter`

```typescript
interface WashiAdapter {
  save(comment: Comment): Promise<void>;
  load(): Promise<Comment[]>;
  update(id: string, updates: Partial<Comment>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### `Comment`

```typescript
interface Comment {
  id: string;         // UUID, generated by the library
  x: number;          // 0–100, percentage of content width
  y: number;          // 0–100, percentage of content height
  text: string;
  color?: string;
  resolved?: boolean;
  createdAt: number;  // Unix ms, generated by the library
}
```

### `NewComment`

Input type for `addComment()`. Omits `id` and `createdAt`, which are generated automatically.

```typescript
interface NewComment {
  x: number;
  y: number;
  text: string;
  color?: string;
}
```

### `MountOptions`

```typescript
interface MountOptions {
  readOnly?: boolean;
  disableBuiltinDialog?: boolean;
}
```

### Event payloads

```typescript
interface PinPlacedEvent     { x: number; y: number; }
interface CommentUpdatedEvent { id: string; updates: Partial<Comment>; }
interface CommentDeletedEvent { id: string; }
interface CommentClickedEvent { comment: Comment; }
interface ModeChangedEvent   { mode: WashiMode; previousMode: WashiMode; }
interface ErrorEvent         { type: string; message: string; error?: Error; }
```

---

## License

MIT
