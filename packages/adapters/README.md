# @washi-ui/adapters

Built-in storage adapters for Washi UI. Use these for quick setup, or implement `WashiAdapter` from `@washi-ui/core` to connect any backend.

## Installation

```bash
npm install @washi-ui/adapters @washi-ui/core
```

---

## `LocalStorageAdapter`

Persists comments to the browser's `localStorage`. Comments survive page reloads.

Best for: demos, prototypes, and single-user annotation tools.

```typescript
import { LocalStorageAdapter } from '@washi-ui/adapters';

// Namespaced by key — use different keys for different pages/views
const adapter = new LocalStorageAdapter('my-page-comments');
```

**Constructor**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageKey` | `string` | `'washi-comments'` | `localStorage` key to read/write under |

**Methods**

| Method | Description |
|--------|-------------|
| `clear()` | Removes all comments from memory and `localStorage`. Useful for resetting demo state. |

```typescript
adapter.clear(); // wipe all stored comments
```

---

## `MemoryAdapter`

Stores comments in memory only. Comments are lost on page reload.

Best for: unit tests, integration tests, SSR environments, and ephemeral sessions.

```typescript
import { MemoryAdapter } from '@washi-ui/adapters';

const adapter = new MemoryAdapter();
```

**Methods**

| Method | Description |
|--------|-------------|
| `clear()` | Clears all in-memory comments. |
| `seed(comments)` | Pre-populates the adapter. Useful for setting up test fixtures. |

```typescript
adapter.seed([
  { id: '1', x: 50, y: 25, text: 'Review this section', createdAt: Date.now() },
]);
```

---

## Custom Adapter

Implement `WashiAdapter` from `@washi-ui/core` to connect Washi to any storage backend — REST API, GraphQL, Firebase, Supabase, etc.

```typescript
import type { WashiAdapter, Comment } from '@washi-ui/core';

export class MyApiAdapter implements WashiAdapter {
  constructor(private readonly pageId: string) {}

  async save(comment: Comment): Promise<void> {
    await fetch(`/api/pages/${this.pageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
  }

  async load(): Promise<Comment[]> {
    const res = await fetch(`/api/pages/${this.pageId}/comments`);
    return res.json();
  }

  async update(id: string, updates: Partial<Comment>): Promise<void> {
    await fetch(`/api/pages/${this.pageId}/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async delete(id: string): Promise<void> {
    await fetch(`/api/pages/${this.pageId}/comments/${id}`, {
      method: 'DELETE',
    });
  }
}
```

The `WashiAdapter` interface:

```typescript
interface WashiAdapter {
  save(comment: Comment): Promise<void>;
  load(): Promise<Comment[]>;
  update(id: string, updates: Partial<Comment>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## License

MIT
