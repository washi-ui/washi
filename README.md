# Washi UI

A pin-based HTML commenting library for modern web applications. Add collaborative annotations to any HTML content rendered in an iframe.

## Features

- **Pin-Based Comments** - Users click anywhere to place comment pins at precise locations
- **Scroll Sync** - Pins stay aligned with content as users scroll
- **Framework Agnostic** - Core library works anywhere, with React bindings included
- **Adapter Pattern** - Bring your own storage backend (REST, GraphQL, Firebase, etc.)
- **TypeScript First** - Full type definitions included

## Packages

| Package | Description |
|---------|-------------|
| [`@washi-ui/core`](./packages/core) | Framework-agnostic core library |
| [`@washi-ui/react`](./packages/react) | React hooks and components |
| [`@washi-ui/adapters`](./packages/adapters) | Built-in adapters (LocalStorage, Memory) |

## Quick Start

### React

```bash
npm install @washi-ui/react @washi-ui/core @washi-ui/adapters
```

```tsx
import { useState } from 'react';
import { useWashi } from '@washi-ui/react';
import { LocalStorageAdapter } from '@washi-ui/adapters';

const adapter = new LocalStorageAdapter('my-page-comments');

function App() {
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  const { iframeRef, mode, setMode, comments, addComment } = useWashi({
    adapter,
    onPinPlaced: ({ x, y }) => {
      // User clicked the overlay — show your dialog, then call addComment
      setPendingPin({ x, y });
    },
  });

  const handleSubmit = async (text: string) => {
    if (!pendingPin) return;
    await addComment({ ...pendingPin, text });
    setPendingPin(null);
  };

  return (
    <div>
      <button onClick={() => setMode(mode === 'view' ? 'annotate' : 'view')}>
        {mode === 'annotate' ? 'Done' : 'Add Comment'}
      </button>
      <div style={{ position: 'relative' }}>
        <iframe ref={iframeRef} src="/content.html" />
      </div>
      {/* Render your custom dialog when pendingPin is set */}
    </div>
  );
}
```

### Vanilla JavaScript

```bash
npm install @washi-ui/core @washi-ui/adapters
```

```javascript
import { Washi } from '@washi-ui/core';
import { LocalStorageAdapter } from '@washi-ui/adapters';

const adapter = new LocalStorageAdapter();
const washi = new Washi(adapter);

await washi.mount(document.querySelector('iframe'));

washi.on('pin:placed', async ({ x, y }) => {
  const text = prompt('Comment:');
  if (text) {
    const comment = await washi.addComment({ x, y, text });
    console.log('Created comment:', comment.id);
  }
});

washi.setMode('annotate');
```

## Demo

Run the demo app:

```bash
# From repo root
pnpm install
pnpm build
cd examples/demo
pnpm dev
```

## Development

This is a pnpm monorepo.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run core package in watch mode
pnpm dev
```

## How It Works

1. **Mount**: Washi creates an invisible overlay positioned over your iframe
2. **View Mode**: Users can click pins to view/interact with comments
3. **Annotate Mode**: Clicking the overlay emits a `pin:placed` event with `{ x, y }` coordinates
4. **Comment Creation**: Call `addComment({ x, y, text })` — the library generates `id` and `createdAt`
5. **Scroll Sync**: The overlay transforms to match iframe scroll position
6. **Adapter**: All persistence is delegated to your adapter implementation

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `pin:placed` | `{ x, y }` | Overlay clicked in annotate mode — use to show comment input UI |
| `comment:created` | `Comment` | A comment was successfully saved via `addComment()` |
| `comment:updated` | `{ id, updates }` | A comment was updated |
| `comment:deleted` | `{ id }` | A comment was deleted |
| `comment:clicked` | `{ comment }` | A pin was clicked |
| `mode:changed` | `{ mode, previousMode }` | Mode switched |
| `error` | `{ type, message, error? }` | An internal error occurred |

## Custom Popover (disable built-in dialog)

```typescript
await washi.mount(iframe, { disableBuiltinDialog: true });

washi.on('comment:clicked', ({ comment }) => {
  // Show your own popover for the clicked comment
  showMyPopover(comment);
});
```

## Creating an Adapter

```typescript
import { WashiAdapter, Comment } from '@washi-ui/core';

class MyAdapter implements WashiAdapter {
  async save(comment: Comment) {
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
  }

  async load(): Promise<Comment[]> {
    const res = await fetch('/api/comments');
    return res.json();
  }

  async update(id: string, updates: Partial<Comment>) {
    await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async delete(id: string) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
  }
}
```

## License

MIT
# washi
