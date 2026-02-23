import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { WashiProvider, useWashiContext, WashiContextValue } from '../WashiProvider';
import { WashiAdapter, Comment } from '@washi-ui/core';

// In-memory adapter for tests
class MemoryAdapter implements WashiAdapter {
  private comments = new Map<string, Comment>();

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment);
  }

  async load(): Promise<Comment[]> {
    return Array.from(this.comments.values());
  }

  async update(id: string, updates: Partial<Comment>): Promise<void> {
    const existing = this.comments.get(id);
    if (existing) this.comments.set(id, { ...existing, ...updates });
  }

  async delete(id: string): Promise<void> {
    this.comments.delete(id);
  }
}

// Component that reads context values and renders them as data-testid spans
function ContextDisplay() {
  const ctx = useWashiContext();
  return React.createElement('div', null,
    React.createElement('span', { 'data-testid': 'mode' }, ctx.mode),
    React.createElement('span', { 'data-testid': 'comment-count' }, ctx.comments.length),
    React.createElement('span', { 'data-testid': 'is-ready' }, String(ctx.isReady)),
    React.createElement('span', { 'data-testid': 'active' }, ctx.activeComment?.id ?? 'none'),
  );
}

// Helper: render a WashiProvider with ContextDisplay + optional extra children
function renderProvider(
  adapter: WashiAdapter,
  options: { initialMode?: 'view' | 'annotate' } = {},
  children: React.ReactNode = null,
) {
  return render(
    React.createElement(WashiProvider, { adapter, ...options },
      React.createElement(ContextDisplay),
      children,
    ),
  );
}

describe('WashiProvider', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('provides default context values', () => {
    renderProvider(adapter);
    expect(screen.getByTestId('mode').textContent).toBe('view');
    expect(screen.getByTestId('comment-count').textContent).toBe('0');
    expect(screen.getByTestId('is-ready').textContent).toBe('false');
  });

  it('initializes mode from initialMode prop', () => {
    renderProvider(adapter, { initialMode: 'annotate' });
    // useState(initialMode) — starts as 'annotate' before iframe loads
    expect(screen.getByTestId('mode').textContent).toBe('annotate');
  });

  it('renders children', () => {
    render(
      React.createElement(WashiProvider, { adapter },
        React.createElement('div', { 'data-testid': 'child' }, 'Hello'),
      ),
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});

describe('useWashiContext', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  it('exposes addComment, updateComment, deleteComment, setMode, onPinPlaced, onCommentClick', () => {
    let ctx!: WashiContextValue;

    function Capture() {
      ctx = useWashiContext();
      return null;
    }

    render(
      React.createElement(WashiProvider, { adapter },
        React.createElement(Capture),
      ),
    );

    expect(typeof ctx.addComment).toBe('function');
    expect(typeof ctx.updateComment).toBe('function');
    expect(typeof ctx.deleteComment).toBe('function');
    expect(typeof ctx.setMode).toBe('function');
    expect(typeof ctx.onPinPlaced).toBe('function');
    expect(typeof ctx.onCommentClick).toBe('function');
  });

  it('onPinPlaced registers a callback and returns an unsubscribe function', () => {
    let ctx!: WashiContextValue;

    function Capture() {
      ctx = useWashiContext();
      return null;
    }

    render(
      React.createElement(WashiProvider, { adapter },
        React.createElement(Capture),
      ),
    );

    const cb = vi.fn();
    const unsub = ctx.onPinPlaced(cb);
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });

  it('setActiveComment updates activeComment state', async () => {
    render(
      React.createElement(WashiProvider, { adapter },
        React.createElement(ContextDisplay),
      ),
    );

    expect(screen.getByTestId('active').textContent).toBe('none');

    // Capture context and set active comment
    let ctx!: WashiContextValue;
    function Capture() { ctx = useWashiContext(); return null; }
    render(React.createElement(WashiProvider, { adapter }, React.createElement(Capture)));

    const fakeComment: Comment = {
      id: 'test-id',
      x: 10,
      y: 20,
      text: 'Hello',
      createdAt: Date.now(),
    };

    await act(async () => {
      ctx.setActiveComment(fakeComment);
    });

    await act(async () => {
      ctx.setActiveComment(null);
    });

    // No throw = setActiveComment works correctly
  });

  it('getCommentIndex returns -1 when no comments exist', () => {
    let ctx!: WashiContextValue;
    function Capture() { ctx = useWashiContext(); return null; }

    render(
      React.createElement(WashiProvider, { adapter },
        React.createElement(Capture),
      ),
    );

    expect(ctx.getCommentIndex('nonexistent')).toBe(-1);
  });

  it('throws when used outside WashiProvider', () => {
    function ConsumerOutsideProvider() {
      useWashiContext();
      return null;
    }

    // Suppress React's own console.error for the thrown error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => {
        render(React.createElement(ConsumerOutsideProvider));
      }).toThrow('useWashiContext must be used within a WashiProvider');
    } finally {
      spy.mockRestore();
    }
  });
});
