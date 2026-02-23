# @washi-ui/react

React bindings for the Washi HTML commenting engine.

## Installation

```bash
npm install @washi-ui/react @washi-ui/core
# or
pnpm add @washi-ui/react @washi-ui/core
```

## Quick Start

### Using the `useWashi` Hook

```tsx
import { useWashi, Comment, WashiAdapter } from '@washi-ui/react';

// Create your adapter
const adapter: WashiAdapter = {
  async save(comment) { /* ... */ },
  async load() { /* ... */ },
  async update(id, updates) { /* ... */ },
  async delete(id) { /* ... */ },
};

function CommentableContent() {
  const {
    iframeRef,
    mode,
    setMode,
    comments,
    addComment,
    deleteComment,
    isReady,
  } = useWashi({
    adapter,
    onCommentCreate: ({ x, y }) => {
      // Show comment input dialog
    },
    onCommentClick: (comment) => {
      // Show comment details
    },
  });

  return (
    <div>
      <button onClick={() => setMode(mode === 'view' ? 'annotate' : 'view')}>
        {mode === 'annotate' ? 'Exit Annotate' : 'Annotate'}
      </button>

      <div style={{ position: 'relative' }}>
        <iframe ref={iframeRef} src="/content.html" />
      </div>

      <ul>
        {comments.map(c => (
          <li key={c.id}>
            {c.text}
            <button onClick={() => deleteComment(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Using Provider Pattern

For larger apps, use the provider pattern to share state across components:

```tsx
import {
  WashiProvider,
  WashiFrame,
  CommentList,
  useWashiContext,
} from '@washi-ui/react';

function App() {
  return (
    <WashiProvider adapter={adapter}>
      <MainContent />
      <Sidebar />
    </WashiProvider>
  );
}

function MainContent() {
  const { mode, setMode, isReady } = useWashiContext();

  return (
    <main>
      <button onClick={() => setMode(mode === 'view' ? 'annotate' : 'view')}>
        Toggle Mode
      </button>
      <WashiFrame src="/content.html" style={{ width: '100%', height: '600px' }} />
    </main>
  );
}

function Sidebar() {
  return (
    <CommentList
      renderComment={(comment, { onResolve, onDelete }) => (
        <div key={comment.id}>
          <p>{comment.text}</p>
          <button onClick={onResolve}>
            {comment.resolved ? 'Unresolve' : 'Resolve'}
          </button>
          <button onClick={onDelete}>Delete</button>
        </div>
      )}
      sort={(a, b) => b.createdAt - a.createdAt}
      emptyState={<p>No comments yet</p>}
    />
  );
}
```

## API Reference

### `useWashi(options)`

Main hook for using Washi in React components.

**Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `adapter` | `WashiAdapter` | Yes | Storage adapter |
| `initialMode` | `'view' \| 'annotate'` | No | Initial mode (default: `'view'`) |
| `mountOptions` | `MountOptions` | No | Mount configuration |
| `onCommentCreate` | `(event) => void` | No | Called when overlay clicked |
| `onCommentClick` | `(comment) => void` | No | Called when pin clicked |
| `onCommentUpdate` | `(data) => void` | No | Called when comment updated |
| `onCommentDelete` | `(id) => void` | No | Called when comment deleted |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `iframeRef` | `RefObject` | Attach to iframe element |
| `mode` | `WashiMode` | Current mode |
| `setMode` | `(mode) => void` | Change mode |
| `comments` | `Comment[]` | All comments |
| `addComment` | `(comment) => Promise` | Add comment |
| `updateComment` | `(id, updates) => Promise` | Update comment |
| `deleteComment` | `(id) => Promise` | Delete comment |
| `isReady` | `boolean` | Mount status |
| `error` | `Error \| null` | Any error |

### `<WashiProvider>`

Context provider for sharing Washi state.

```tsx
<WashiProvider
  adapter={adapter}
  initialMode="view"
  mountOptions={{ readOnly: false }}
>
  {children}
</WashiProvider>
```

### `<WashiFrame>`

Iframe wrapper that auto-registers with provider.

```tsx
<WashiFrame
  src="/content.html"
  style={{ width: '100%', height: '600px' }}
/>
```

### `<CommentList>`

Helper for rendering comments.

```tsx
<CommentList
  renderComment={(comment, actions) => (
    <div>{comment.text}</div>
  )}
  filter={(c) => !c.resolved}
  sort={(a, b) => b.createdAt - a.createdAt}
  emptyState={<p>No comments</p>}
/>
```

### `useWashiContext()`

Access Washi context from any child component.

```tsx
function ChildComponent() {
  const { comments, mode, setMode } = useWashiContext();
  // ...
}
```

## TypeScript

All types are exported for convenience:

```typescript
import type {
  Comment,
  WashiMode,
  WashiAdapter,
  MountOptions,
  CommentCreatedEvent,
} from '@washi-ui/react';
```

## License

MIT
