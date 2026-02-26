import { useState, useEffect } from 'react';
import { useWashiContext } from './WashiProvider';
import type { Comment, PinPlacedEvent } from '@washi-ui/core';

export interface WashiPinDialogProps {
  accentColor?: string;
  /** Optional callback fired after a comment is successfully created */
  onComment?: (comment: Comment) => void;
}

interface PendingPin {
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  containerW: number;
  containerH: number;
}

/**
 * Self-contained pin comment dialog.
 *
 * Subscribes to `pin:placed` events from the context and renders a small
 * popover anchored to the clicked position. On submit it calls `addComment`
 * and switches the mode back to 'view' automatically.
 *
 * Drop this anywhere inside a `<WashiProvider>` — no props required.
 */
export function WashiPinDialog({ accentColor = '#667eea', onComment }: WashiPinDialogProps) {
  const { onPinPlaced, addComment, setMode, iframeEl } = useWashiContext();
  const [pending, setPending] = useState<PendingPin | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    return onPinPlaced((event: PinPlacedEvent) => {
      const containerW = iframeEl?.clientWidth ?? window.innerWidth;
      const containerH = iframeEl?.clientHeight ?? window.innerHeight;
      setText('');
      setPending({
        x: event.x,
        y: event.y,
        pixelX: (event.x / 100) * containerW,
        pixelY: (event.y / 100) * containerH,
        containerW,
        containerH,
      });
    });
  }, [onPinPlaced, iframeEl]);

  if (!pending) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const comment = await addComment({ x: pending.x, y: pending.y, text: text.trim(), color: accentColor });
    setPending(null);
    setMode('view');
    onComment?.(comment);
  };

  const handleCancel = () => setPending(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) handleSubmit();
    if (e.key === 'Escape') handleCancel();
  };

  const POPOVER_WIDTH = 280;
  const left = Math.min(
    Math.max(pending.pixelX - POPOVER_WIDTH / 2, 8),
    pending.containerW - POPOVER_WIDTH - 8,
  );
  const showAbove = pending.pixelY > pending.containerH * 0.65;
  const top = showAbove ? pending.pixelY - 172 : pending.pixelY + 16;

  return (
    <>
      {/* Transparent backdrop — blocks accidental iframe clicks, dismisses on outside click */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} onClick={handleCancel} />

      <div
        style={{
          position: 'fixed',
          left,
          top,
          width: POPOVER_WIDTH,
          zIndex: 10000,
          backgroundColor: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          border: '1px solid rgba(0,0,0,0.06)',
          padding: '14px 16px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
            Add comment
          </span>
          <button
            onClick={handleCancel}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 14, padding: '2px 4px', borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        <textarea
          style={{
            width: '100%', height: 80, padding: '8px 10px',
            border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8125rem',
            resize: 'none', boxSizing: 'border-box', lineHeight: 1.5,
            fontFamily: 'inherit', color: '#374151', outline: 'none',
          }}
          placeholder="Leave a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            style={{
              padding: '6px 12px', fontSize: '0.8125rem', border: '1px solid #e5e7eb',
              borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', color: '#6b7280',
            }}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            style={{
              padding: '6px 12px', fontSize: '0.8125rem', border: 'none',
              borderRadius: 6, backgroundColor: accentColor, color: '#fff',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              opacity: text.trim() ? 1 : 0.5,
            }}
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </>
  );
}
