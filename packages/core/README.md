# @washi-ui/core

Framework-agnostic HTML commenting engine. Add pin-based annotations to any HTML content rendered in an iframe.

## Installation

```bash
npm install @washi-ui/core
# or
pnpm add @washi-ui/core
```

## Quick Start

```typescript
import { Washi, WashiAdapter, Comment } from '@washi-ui/core';

// 1. Create your adapter (implements storage)
const adapter: WashiAdapter = {
  async save(comment) {
    await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  },
  async load() {
    const res = await fetch('/api/comments');
    return res.json();
  },
  async update(id, updates) {
    await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async delete(id) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
  },
};

// 2. Create Washi instance
const washi = new Washi(adapter);

// 3. Mount to an iframe
const iframe = document.querySelector('iframe');
await washi.mount(iframe);

// 4. Listen for events
washi.on('comment:created', ({ x, y }) => {
  // User clicked in annotate mode - show comment input
  console.log(`New comment at ${x}%, ${y}%`);
});

washi.on('comment:clicked', (comment) => {
  // User clicked a pin - show comment details
  console.log('Clicked:', comment.text);
});

// 5. Enable annotation mode
washi.setMode('annotate');
```

## API Reference

### Constructor

```typescript
new Washi(adapter: WashiAdapter)
```

Creates a new Washi instance with the specified storage adapter.

### Methods

#### `mount(iframe, options?)`

Mounts Washi to an iframe element. This is async and loads existing comments.

```typescript
await washi.mount(iframe);

// With options
await washi.mount(iframe, { readOnly: true });
```

**Options:**
- `readOnly?: boolean` - Prevents switching to annotate mode
- `theme?: 'light' | 'dark'` - Visual theme (reserved for future use)

#### `unmount()`

Unmounts and cleans up all resources. Safe to call multiple times.

```typescript
washi.unmount();
```

#### `setMode(mode)`

Sets the interaction mode. Emits `mode:changed` event.

- `'view'` - Pins are clickable, overlay doesn't capture clicks
- `'annotate'` - Clicking overlay emits coordinates for new comments

```typescript
washi.setMode('annotate');
```

#### `addComment(comment)`

Adds a comment and renders its pin.

```typescript
await washi.addComment({
  id: 'comment-1',      // You provide the ID
  x: 50,                // 0-100 percentage
  y: 25,                // 0-100 percentage
  text: 'Review this',
  createdAt: Date.now(),
});
```

#### `updateComment(id, updates)`

Updates a comment. Re-renders pin if position changes.

```typescript
await washi.updateComment('comment-1', { resolved: true });
await washi.updateComment('comment-1', { x: 75, y: 50 });
```

#### `deleteComment(id)`

Deletes a comment and removes its pin.

```typescript
await washi.deleteComment('comment-1');
```

#### `getComments()`

Returns all comments as an array of shallow copies.

```typescript
const comments = washi.getComments();
```

#### `on(event, handler)`

Subscribes to events. Returns an unsubscribe function.

```typescript
const unsubscribe = washi.on('comment:clicked', (comment) => {
  console.log(comment);
});

// Later
unsubscribe();
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `comment:created` | `{ x, y }` | Overlay clicked in annotate mode |
| `comment:clicked` | `Comment` | Pin clicked |
| `comment:updated` | `{ id, updates }` | Comment updated |
| `comment:deleted` | `string` (id) | Comment deleted |
| `mode:changed` | `{ mode, previousMode }` | Mode changed |

### WashiAdapter Interface

```typescript
interface WashiAdapter {
  save(comment: Comment): Promise<void>;
  load(): Promise<Comment[]>;
  update(id: string, updates: Partial<Comment>): Promise<void>;
  delete(id: string): Promise<void>;
  subscribe?(callback: (comment: Comment) => void): () => void;
}
```

### Comment Interface

```typescript
interface Comment {
  id: string;           // Unique ID (you provide this)
  x: number;            // 0-100 percentage position
  y: number;            // 0-100 percentage position
  text: string;         // Comment content
  resolved?: boolean;   // Resolution status
  createdAt: number;    // Unix timestamp (ms)
}
```

## Framework Integration

- **React**: Use `@washi-ui/react` for hooks and components
- **Vue/Svelte/etc**: Use `@washi-ui/core` directly

## License

MIT
