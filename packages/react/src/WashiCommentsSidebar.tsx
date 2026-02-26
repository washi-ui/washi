import { useState, useEffect } from 'react';
import { useWashiContext } from './WashiProvider';
import type { WashiToolBubblePosition } from './WashiToolBubble';

export interface WashiCommentsSidebarProps {
  open: boolean;
  onClose: () => void;
  /** Which corner the tool bubble is anchored to. Panel slides in from that side and stops above the bubble. Default: 'bottom-right' */
  position?: WashiToolBubblePosition;
  accentColor?: string;
}

// Must match WashiToolBubble layout constants
const BUBBLE_EDGE = 24;    // px from screen edge
const BUBBLE_HEIGHT = 52;  // pill height: 6px pad + 40px button + 6px pad
const GAP = 10;            // breathing room between panel bottom and bubble top

/** Returns the fixed-position bounds that leave the tool bubble area exposed */
function getPanelBounds(position: WashiToolBubblePosition): React.CSSProperties {
  const reserved = BUBBLE_EDGE + BUBBLE_HEIGHT + GAP; // ~86px
  switch (position) {
    case 'bottom-right': return { top: 0, right: 0, bottom: reserved };
    case 'bottom-left':  return { top: 0, left: 0,  bottom: reserved };
    case 'top-right':    return { top: reserved, right: 0, bottom: 0 };
    case 'top-left':     return { top: reserved, left: 0,  bottom: 0 };
  }
}

// Inject slide keyframes once at module load
const KEYFRAMES_ID = '__washi-panel-kf__';
if (typeof document !== 'undefined' && !document.getElementById(KEYFRAMES_ID)) {
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes washi-panel-in-right  { from { transform: translateX(100%);  opacity: 0; } to { transform: translateX(0);   opacity: 1; } }
    @keyframes washi-panel-out-right { from { transform: translateX(0);     opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    @keyframes washi-panel-in-left   { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0);   opacity: 1; } }
    @keyframes washi-panel-out-left  { from { transform: translateX(0);     opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

const ANIM_DURATION = 240;

export function WashiCommentsSidebar({
  open,
  onClose,
  position = 'bottom-right',
  accentColor = '#667eea',
}: WashiCommentsSidebarProps) {
  const { comments, updateComment, deleteComment } = useWashiContext();

  const [visible, setVisible] = useState(open);
  const [phase, setPhase] = useState<'in' | 'out'>(open ? 'in' : 'out');

  useEffect(() => {
    if (open) {
      setVisible(true);
      const raf = requestAnimationFrame(() => setPhase('in'));
      return () => cancelAnimationFrame(raf);
    } else {
      setPhase('out');
      const t = setTimeout(() => setVisible(false), ANIM_DURATION);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  const sortedComments = [...comments].sort((a, b) => a.createdAt - b.createdAt);
  const side = position.endsWith('right') ? 'right' : 'left';
  const animName = phase === 'in' ? `washi-panel-in-${side}` : `washi-panel-out-${side}`;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    ...getPanelBounds(position),
    width: 320,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    boxShadow: side === 'right'
      ? '-4px 0 24px rgba(0,0,0,0.10)'
      : '4px 0 24px rgba(0,0,0,0.10)',
    borderLeft: side === 'right' ? '1px solid #e5e7eb' : 'none',
    borderRight: side === 'left' ? '1px solid #e5e7eb' : 'none',
    animation: `${animName} ${ANIM_DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards`,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff', flexShrink: 0,
      }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
          Comments ({comments.length})
        </span>
        <button
          onClick={onClose}
          title="Close"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, border: 'none', borderRadius: 6,
            backgroundColor: 'transparent', cursor: 'pointer',
            color: '#9ca3af', fontSize: 14, padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {sortedComments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#9ca3af', fontSize: '0.875rem',
          }}>
            <p style={{ marginBottom: 8 }}>No comments yet.</p>
            <p>Use the annotate tool to add one.</p>
          </div>
        ) : (
          sortedComments.map((comment, index) => {
            const color = comment.color || accentColor;
            const borderColor = comment.resolved ? '#10b981' : color;
            const badgeBg = comment.resolved ? '#10b981' : color;

            return (
              <div
                key={comment.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: '12px',
                  marginBottom: 10,
                  opacity: comment.resolved ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 20, height: 20, borderRadius: '50%', backgroundColor: badgeBg,
                      color: '#fff', fontSize: '0.7rem', fontWeight: 700, marginRight: 8, flexShrink: 0,
                    }}>
                      {comment.resolved ? '✓' : index + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      ({comment.x.toFixed(1)}%, {comment.y.toFixed(1)}%)
                    </span>
                  </div>
                  {comment.resolved && (
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                      Resolved
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 10, lineHeight: 1.5 }}>
                  {comment.text}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      padding: '4px 10px', fontSize: '0.75rem', border: 'none',
                      borderRadius: 4, cursor: 'pointer', backgroundColor: '#e0e7ff', color: '#4f46e5',
                    }}
                    onClick={() => updateComment(comment.id, { resolved: !comment.resolved })}
                  >
                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                  </button>
                  <button
                    style={{
                      padding: '4px 10px', fontSize: '0.75rem', border: 'none',
                      borderRadius: 4, cursor: 'pointer', backgroundColor: '#fee2e2', color: '#dc2626',
                    }}
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
