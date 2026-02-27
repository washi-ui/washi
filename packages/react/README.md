# @washi-ui/react

React bindings for the Washi HTML commenting engine. Provides a context provider, hooks, and ready-made UI components for adding pin-based annotations to any iframe-rendered content.

## Installation

```bash
npm install @washi-ui/react @washi-ui/core
```

---

## Quick Start

### Drop-in UI (`WashiProvider` + `WashiFrame` + `WashiUI`)

The fastest path. `WashiUI` renders a floating tool bubble, a comments sidebar, and a pin dialog — no custom UI needed.

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

### Custom UI (`useWashi` hook)

For full control over the interface, use the `useWashi` hook directly:

```tsx
import { useWashi } from '@washi-ui/react';
import { LocalStorageAdapter } from '@washi-ui/adapters';

const adapter = new LocalStorageAdapter('my-page');

function App() {
  const { iframeRef, mode, setMode, comments, addComment } = useWashi({
    adapter,
    onPinPlaced: async ({ x, y }) => {
      // Called when the user clicks the overlay in annotate mode.
      // Show your own dialog, then call addComment.
      const text = prompt('Add a comment:');
      if (text) await addComment({ x, y, text });
    },
    onCommentClick: (comment) => {
      console.log('Pin clicked:', comment.text);
    },
  });

  return (
    <div>
      <button onClick={() => setMode(mode === 'annotate' ? 'view' : 'annotate')}>
        {mode === 'annotate' ? 'Done' : 'Annotate'}
      </button>
      <div style={{ position: 'relative' }}>
        <iframe
          ref={iframeRef}
          src="/content.html"
          style={{ width: '100%', height: '600px', border: 'none' }}
        />
      </div>
    </div>
  );
}
```

---

## Components

### `<WashiProvider>`

Context provider that creates and manages the Washi instance. Wrap your iframe and any Washi UI components inside it.

```tsx
<WashiProvider
  adapter={adapter}
  initialMode="view"
  mountOptions={{ readOnly: false, disableBuiltinDialog: false }}
>
  {children}
</WashiProvider>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `adapter` | `WashiAdapter` | required | Storage adapter |
| `initialMode` | `'view' \| 'annotate'` | `'view'` | Starting mode |
| `mountOptions` | `MountOptions` | — | Passed to `washi.mount()` |

---

### `<WashiFrame>`

An `<iframe>` wrapper that auto-registers with the nearest `WashiProvider`. Accepts all standard iframe attributes.

```tsx
<WashiFrame
  src="/content.html"
  style={{ width: '100%', height: '100vh', border: 'none' }}
/>

{/* Or with inline HTML */}
<WashiFrame
  srcDoc={htmlString}
  style={{ width: '100%', height: '100vh', border: 'none' }}
/>
```

Must be used inside a `WashiProvider`.

---

### `<WashiUI>`

All-in-one floating UI layer. Renders `WashiToolBubble`, `WashiCommentsSidebar`, and `WashiPinDialog` together, wired up and ready to use.

```tsx
<WashiUI position="bottom-right" accentColor="#667eea" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `WashiToolBubblePosition` | `'bottom-right'` | Corner for the tool bubble and sidebar |
| `accentColor` | `string` | `'#667eea'` | Accent color for buttons and pins |
| `showLoader` | `boolean` | `true` | Show a loading spinner while the iframe initialises |

Must be used inside a `WashiProvider`.

---

### `<WashiToolBubble>`

The floating pill button that toggles annotate mode and opens the sidebar. Use this directly when building a custom layout with the other primitive components.

```tsx
<WashiToolBubble
  position="bottom-right"
  accentColor="#667eea"
  sidebarOpen={sidebarOpen}
  onSidebarToggle={() => setSidebarOpen(o => !o)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `WashiToolBubblePosition` | `'bottom-right'` | Viewport corner |
| `accentColor` | `string` | `'#667eea'` | Active state colour |
| `sidebarOpen` | `boolean` | `false` | Whether sidebar is open (controls icon state) |
| `onSidebarToggle` | `() => void` | — | Called when the sidebar button is clicked |

---

### `<WashiCommentsSidebar>`

A slide-in panel listing all comments with resolve/delete actions.

```tsx
<WashiCommentsSidebar
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  position="bottom-right"
  accentColor="#667eea"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Called when the close button is clicked |
| `position` | `WashiToolBubblePosition` | `'bottom-right'` | Which side to slide in from |
| `accentColor` | `string` | `'#667eea'` | Accent colour for resolved badges |

---

### `<WashiPinDialog>`

A popover that appears when the user places a pin in annotate mode. Handles text input, calls `addComment`, and switches back to view mode on submit.

```tsx
<WashiPinDialog
  accentColor="#667eea"
  onComment={(comment) => console.log('Created:', comment.id)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accentColor` | `string` | `'#667eea'` | Submit button colour |
| `onComment` | `(comment: Comment) => void` | — | Called after a comment is successfully created |

---

### `<CommentList>`

Headless list component for rendering comments with custom UI. Reads from context and exposes `onResolve`, `onDelete`, and `onUpdate` action handlers.

```tsx
<CommentList
  renderComment={(comment, { onResolve, onDelete }) => (
    <div key={comment.id} className="comment">
      <p>{comment.text}</p>
      <button onClick={onResolve}>
        {comment.resolved ? 'Unresolve' : 'Resolve'}
      </button>
      <button onClick={onDelete}>Delete</button>
    </div>
  )}
  filter={(c) => !c.resolved}
  sort={(a, b) => b.createdAt - a.createdAt}
  emptyState={<p>No comments yet.</p>}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `renderComment` | `(comment, actions) => ReactNode` | Render function for each comment |
| `filter` | `(comment) => boolean` | Optional filter predicate |
| `sort` | `(a, b) => number` | Optional sort comparator |
| `emptyState` | `ReactNode` | Rendered when no comments match |

---

## `useWashi(options)`

Low-level hook for managing a Washi instance directly. Returns a ref to attach to a plain `<iframe>` element plus all state and methods.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | `WashiAdapter` | required | Storage adapter |
| `initialMode` | `WashiMode` | `'view'` | Starting mode |
| `mountOptions` | `MountOptions` | — | Passed to `washi.mount()` |
| `onPinPlaced` | `(event: PinPlacedEvent) => void` | — | Called when overlay is clicked in annotate mode |
| `onCommentClick` | `(comment: Comment) => void` | — | Called when a pin is clicked |
| `onCommentUpdate` | `(data) => void` | — | Called after a comment is updated |
| `onCommentDelete` | `(id: string) => void` | — | Called after a comment is deleted |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `iframeRef` | `RefObject<HTMLIFrameElement>` | Attach to your `<iframe>` element |
| `mode` | `WashiMode` | Current mode (`'view'` or `'annotate'`) |
| `setMode` | `(mode: WashiMode) => void` | Switch modes |
| `comments` | `Comment[]` | All current comments |
| `addComment` | `(input: NewComment) => Promise<Comment>` | Add a comment — `id` and `createdAt` are generated automatically |
| `updateComment` | `(id, updates) => Promise<void>` | Update a comment |
| `deleteComment` | `(id) => Promise<void>` | Delete a comment |
| `isReady` | `boolean` | True once the iframe has loaded and Washi has mounted |
| `error` | `Error \| null` | Any mount or operation error |

---

## `useWashiContext()`

Access the Washi context from any component inside a `WashiProvider`.

```tsx
function StatusBar() {
  const { mode, comments, isReady } = useWashiContext();

  return (
    <div>
      {isReady ? `${comments.length} comments · ${mode} mode` : 'Loading…'}
    </div>
  );
}
```

---

## TypeScript

All types are re-exported from `@washi-ui/react` for convenience:

```typescript
import type {
  Comment,
  NewComment,
  WashiMode,
  WashiEvent,
  WashiAdapter,
  MountOptions,
  PinPlacedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  CommentClickedEvent,
  ModeChangedEvent,
  ErrorEvent,
} from '@washi-ui/react';
```

---

## License

MIT
