<p align="center">
  <img src=".github/assets/washi-ui-logo.png" alt="Washi UI" width="100%" />
</p>

<p align="center">
  Pin-based HTML commenting for modern web applications.<br />
  Washi lets users click anywhere on an iframe-rendered page to drop comment pins,<br />
  creating a Figma-style annotation layer on top of any HTML content.
</p>

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@washi-ui/core`](./packages/core) | ![npm](https://img.shields.io/npm/v/@washi-ui/core) | Framework-agnostic engine |
| [`@washi-ui/react`](./packages/react) | ![npm](https://img.shields.io/npm/v/@washi-ui/react) | React hooks and components |
| [`@washi-ui/adapters`](./packages/adapters) | ![npm](https://img.shields.io/npm/v/@washi-ui/adapters) | Built-in storage adapters |

---

## Quick Start — React

### 1. Install

```bash
npm install @washi-ui/react @washi-ui/core @washi-ui/adapters
```

### 2. Drop in `WashiUI`

The fastest path: wrap your iframe in `WashiProvider`, swap `<iframe>` for `<WashiFrame>`, and add `<WashiUI>`. You get a floating tool bubble, a comments sidebar, and a pin dialog — zero configuration.

```tsx
import { useMemo } from 'react';
import { WashiProvider, WashiFrame, WashiUI } from '@washi-ui/react';
import { LocalStorageAdapter } from '@washi-ui/adapters';

export default function App() {
  const adapter = useMemo(() => new LocalStorageAdapter('my-page'), []);

  return (
    <WashiProvider adapter={adapter}>
      <WashiFrame
        src="/content.html"
        style={{ width: '100%', height: '100vh', border: 'none' }}
      />
      <WashiUI position="bottom-right" />
    </WashiProvider>
  );
}
```

### 3. Custom UI

For full control, use the `useWashi` hook and bring your own UI:

```tsx
import { useRef } from 'react';
import { useWashi } from '@washi-ui/react';
import { LocalStorageAdapter } from '@washi-ui/adapters';

const adapter = new LocalStorageAdapter('my-page');

function App() {
  const { iframeRef, mode, setMode, comments, addComment } = useWashi({
    adapter,
    onPinPlaced: async ({ x, y }) => {
      const text = prompt('Add a comment:');
      if (text) await addComment({ x, y, text });
    },
  });

  return (
    <div>
      <button onClick={() => setMode(mode === 'annotate' ? 'view' : 'annotate')}>
        {mode === 'annotate' ? 'Done' : 'Annotate'}
      </button>
      <iframe ref={iframeRef} src="/content.html" style={{ width: '100%', height: '600px' }} />
    </div>
  );
}
```

---

## Quick Start — Vanilla JS

```bash
npm install @washi-ui/core @washi-ui/adapters
```

```javascript
import { Washi } from '@washi-ui/core';
import { LocalStorageAdapter } from '@washi-ui/adapters';

const washi = new Washi(new LocalStorageAdapter('my-page'));

await washi.mount(document.querySelector('iframe'));

washi.on('pin:placed', async ({ x, y }) => {
  const text = prompt('Add a comment:');
  if (text) await washi.addComment({ x, y, text });
});

washi.setMode('annotate');
```

---

## How It Works

1. **Mount** — Washi appends a transparent overlay div on top of your iframe
2. **View mode** — overlay has `pointer-events: none`; existing pins are clickable
3. **Annotate mode** — overlay captures clicks and emits `pin:placed` with `{ x, y }` as percentages of the content area
4. **addComment** — call it with `{ x, y, text }`; the library generates `id` and `createdAt`, persists via your adapter, and renders the pin
5. **Scroll sync** — the overlay translates to match the iframe's scroll position, keeping pins anchored to content

---

## Events

Subscribe via `washi.on(event, handler)`. Each call returns an unsubscribe function.

| Event | Payload | When |
|-------|---------|------|
| `pin:placed` | `{ x, y }` | User clicked the overlay in annotate mode |
| `comment:created` | `Comment` | `addComment()` succeeded |
| `comment:updated` | `{ id, updates }` | `updateComment()` succeeded |
| `comment:deleted` | `{ id }` | `deleteComment()` succeeded |
| `comment:clicked` | `{ comment }` | User clicked an existing pin |
| `mode:changed` | `{ mode, previousMode }` | `setMode()` was called |
| `error` | `{ type, message, error? }` | An internal error occurred |

---

## Adapters

Adapters handle persistence. Use a built-in one or implement `WashiAdapter` for any backend.

### Built-in adapters

```typescript
import { LocalStorageAdapter, MemoryAdapter } from '@washi-ui/adapters';

// Persists to localStorage — good for demos and single-user apps
const adapter = new LocalStorageAdapter('my-page-comments');

// In-memory only — good for tests and ephemeral sessions
const adapter = new MemoryAdapter();
```

### Custom adapter

```typescript
import type { WashiAdapter, Comment } from '@washi-ui/core';

class MyApiAdapter implements WashiAdapter {
  async save(comment: Comment) {
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
  }

  async load(): Promise<Comment[]> {
    return fetch('/api/comments').then(r => r.json());
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

---

## Mount Options

```typescript
await washi.mount(iframe, {
  readOnly: true,            // Disable annotate mode
  disableBuiltinDialog: true, // Suppress the built-in click popover
});
```

Use `disableBuiltinDialog` when rendering your own popover via the `comment:clicked` event.

---

## Development

This is a pnpm monorepo.

```bash
pnpm install   # install dependencies
pnpm build     # build all packages
pnpm test      # run all tests
pnpm lint      # typecheck all packages
```

Run the dev sandbox:

```bash
pnpm --filter @washi-ui/demo dev
```

---

## License

MIT
