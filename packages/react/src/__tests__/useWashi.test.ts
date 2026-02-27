import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { useWashi, UseWashiReturn } from '../useWashi';
import { WashiAdapter, Comment, NewComment } from '@washi-ui/core';

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

  seed(comment: Comment): void {
    this.comments.set(comment.id, comment);
  }
}

function createTestInput(overrides: Partial<NewComment> = {}): NewComment {
  return { x: 50, y: 50, text: 'Test comment', ...overrides };
}

/**
 * Renders a full component that uses useWashi and includes an actual <iframe>.
 * This ensures iframeRef.current is set before effects run, mirroring real usage.
 */
function renderHarness(
  adapter: WashiAdapter,
  options: Partial<Parameters<typeof useWashi>[0]> = {},
) {
  let captured!: UseWashiReturn;

  function Harness() {
    const result = useWashi({ adapter, ...options });
    captured = result;
    return React.createElement('div', { style: { position: 'relative' } },
      React.createElement('iframe', { ref: result.iframeRef }),
    );
  }

  const utils = render(React.createElement(Harness));
  return { utils, getResult: () => captured };
}

describe('useWashi', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter();
  });

  describe('initial state', () => {
    it('returns default initial values', () => {
      const { getResult } = renderHarness(adapter);
      const result = getResult();
      expect(result.mode).toBe('view');
      expect(result.comments).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('exposes expected API surface', () => {
      const { getResult } = renderHarness(adapter);
      const result = getResult();
      expect(typeof result.setMode).toBe('function');
      expect(typeof result.addComment).toBe('function');
      expect(typeof result.updateComment).toBe('function');
      expect(typeof result.deleteComment).toBe('function');
      expect(result.iframeRef).toBeDefined();
    });
  });

  describe('after mount', () => {
    it('marks isReady after iframe mounts', async () => {
      const { getResult } = renderHarness(adapter);

      await act(async () => {});

      expect(getResult().isReady).toBe(true);
      expect(getResult().error).toBeNull();
    });

    it('loads pre-existing comments from adapter', async () => {
      const seeded: Comment = {
        id: 'seeded-1',
        x: 20,
        y: 30,
        text: 'Pre-existing',
        createdAt: Date.now(),
      };
      adapter.seed(seeded);

      const { getResult } = renderHarness(adapter);
      await act(async () => {});

      expect(getResult().comments).toHaveLength(1);
      expect(getResult().comments[0].id).toBe('seeded-1');
    });

    it('addComment returns completed Comment with generated id and createdAt', async () => {
      const { getResult } = renderHarness(adapter);
      await act(async () => {});

      let comment!: Comment;
      await act(async () => {
        comment = await getResult().addComment(createTestInput({ text: 'Hello' }));
      });

      expect(comment.id).toBeTruthy();
      expect(typeof comment.id).toBe('string');
      expect(comment.createdAt).toBeGreaterThan(0);
      expect(comment.text).toBe('Hello');
    });

    it('addComment updates comments state', async () => {
      const { getResult } = renderHarness(adapter);
      await act(async () => {});

      await act(async () => {
        await getResult().addComment(createTestInput());
      });

      expect(getResult().comments).toHaveLength(1);
    });

    it('onPinPlaced fires with {x, y} when overlay clicked in annotate mode', async () => {
      const onPinPlaced = vi.fn();
      const { getResult } = renderHarness(adapter, { onPinPlaced });
      await act(async () => {});

      await act(async () => {
        getResult().setMode('annotate');
      });

      const overlay = document.querySelector('.washi-overlay') as HTMLElement;
      expect(overlay).toBeTruthy();

      act(() => {
        overlay.dispatchEvent(
          new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }),
        );
      });

      expect(onPinPlaced).toHaveBeenCalledTimes(1);
      const payload = onPinPlaced.mock.calls[0][0];
      expect(typeof payload.x).toBe('number');
      expect(typeof payload.y).toBe('number');
    });
  });

  describe('error handling', () => {
    it('throws when addComment called before mount (no iframe rendered)', async () => {
      // Create a hook without rendering an iframe — Washi will not be mounted
      let captured!: UseWashiReturn;

      function HarnessNoIframe() {
        captured = useWashi({ adapter });
        // Intentionally NOT rendering an iframe
        return null;
      }

      render(React.createElement(HarnessNoIframe));

      await expect(captured.addComment(createTestInput())).rejects.toThrow('not mounted');
    });
  });
});
