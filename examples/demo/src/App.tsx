import { useState, useMemo, useEffect } from 'react';
import {
  WashiProvider,
  WashiFrame,
  CommentList,
  useWashiContext,
  Comment,
  PinPlacedEvent,
} from '@washi-ui/react';
import { MockAdapter } from './adapters/MockAdapter';

// Styles
const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  } as React.CSSProperties,
  modeBadge: {
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '4px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
  } as React.CSSProperties,
  modeButton: (isAnnotate: boolean, disabled: boolean) =>
    ({
      padding: '8px 16px',
      fontSize: '0.875rem',
      fontWeight: 500,
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: isAnnotate ? '#667eea' : '#e5e7eb',
      color: isAnnotate ? '#fff' : '#374151',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  iframeContainer: (isAnnotate: boolean, isReady: boolean) =>
    ({
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      cursor: isAnnotate ? 'crosshair' : 'default',
      boxShadow: isAnnotate ? 'inset 0 0 0 3px #667eea' : 'none',
      transition: 'box-shadow 0.2s',
      opacity: isReady ? 1 : 0.5,
    }) as React.CSSProperties,
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as React.CSSProperties,
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 100,
  } as React.CSSProperties,
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  instructionBanner: (isAnnotate: boolean) =>
    ({
      padding: '8px 16px',
      backgroundColor: isAnnotate ? '#eef2ff' : '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.875rem',
      color: isAnnotate ? '#4f46e5' : '#6b7280',
      textAlign: 'center',
      transition: 'all 0.2s',
    }) as React.CSSProperties,
  sidebar: {
    width: '320px',
    borderLeft: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  } as React.CSSProperties,
  sidebarTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  } as React.CSSProperties,
  commentsList: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  } as React.CSSProperties,
  commentItem: (resolved: boolean, color: string) =>
    ({
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '12px',
      opacity: resolved ? 0.6 : 1,
      borderLeftColor: resolved ? '#10b981' : color,
      borderLeftWidth: '3px',
    }) as React.CSSProperties,
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  } as React.CSSProperties,
  commentNumber: (color: string) =>
    ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: color,
      color: '#fff',
      fontSize: '0.75rem',
      fontWeight: 600,
      marginRight: '8px',
    }) as React.CSSProperties,
  commentPosition: {
    fontSize: '0.75rem',
    color: '#6b7280',
  } as React.CSSProperties,
  commentText: {
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: '12px',
    lineHeight: 1.5,
  } as React.CSSProperties,
  commentActions: {
    display: 'flex',
    gap: '8px',
  } as React.CSSProperties,
  actionButton: (variant: 'resolve' | 'delete') =>
    ({
      padding: '4px 10px',
      fontSize: '0.75rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: variant === 'delete' ? '#fee2e2' : '#e0e7ff',
      color: variant === 'delete' ? '#dc2626' : '#4f46e5',
    }) as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
  } as React.CSSProperties,
  modal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  } as React.CSSProperties,
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxWidth: '90vw',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical',
    marginBottom: '16px',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  cancelButton: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,
  submitButton: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#667eea',
    color: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,
};

// Default color palette for comment pins (matches core WASHI_COLORS)
const WASHI_COLORS = [
  '#667eea', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
];

function getCommentColor(comment: Comment): string {
  return comment.color || WASHI_COLORS[0];
}


// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Comment input modal
interface CommentModalProps {
  position: { x: number; y: number };
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function CommentModal({ position, onSubmit, onCancel }: CommentModalProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div style={styles.modal} onClick={onCancel}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Add Comment</h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '12px',
          }}
        >
          Position: ({position.x.toFixed(1)}%, {position.y.toFixed(1)}%)
        </p>
        <textarea
          style={styles.textarea}
          placeholder='Enter your comment...'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
}

// Main content area with mode toggle
function MainContent() {
  const { mode, setMode, addComment, isReady, onPinPlaced } =
    useWashiContext();
  const [pendingComment, setPendingComment] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Subscribe to comment creation
  useEffect(() => {
    const unsubscribe = onPinPlaced((event: PinPlacedEvent) => {
      setPendingComment({ x: event.x, y: event.y });
    });
    return unsubscribe;
  }, [onPinPlaced]);

  const handleSubmitComment = async (text: string) => {
    if (!pendingComment) return;

    await addComment({
      x: pendingComment.x,
      y: pendingComment.y,
      text,
    });
    setPendingComment(null);
  };

  const isAnnotate = mode === 'annotate';

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Washi UI Demo</h1>
          {isAnnotate && <span style={styles.modeBadge}>Annotate Mode</span>}
        </div>
        <button
          style={styles.modeButton(isAnnotate, !isReady)}
          onClick={() => setMode(isAnnotate ? 'view' : 'annotate')}
          disabled={!isReady}
        >
          {isAnnotate ? 'Exit Annotate Mode' : 'Annotate'}
        </button>
      </header>
      <div style={styles.instructionBanner(isAnnotate)}>
        {!isReady ?
          'Loading content...'
        : isAnnotate ?
          'Click anywhere on the content to add a comment'
        : 'Click "Annotate" to start adding comments'}
      </div>
      <div style={styles.iframeContainer(isAnnotate, isReady)}>
        {!isReady && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
          </div>
        )}
        <WashiFrame src='/sample-content.html' style={styles.iframe} />
      </div>
      {pendingComment && (
        <CommentModal
          position={pendingComment}
          onSubmit={handleSubmitComment}
          onCancel={() => setPendingComment(null)}
        />
      )}
    </main>
  );
}

// Comment sidebar
function Sidebar() {
  const { comments } = useWashiContext();

  // Sort comments by creation time (newest first) and assign indices
  const sortedComments = [...comments].sort(
    (a, b) => a.createdAt - b.createdAt,
  );
  const commentIndexMap = new Map(sortedComments.map((c, i) => [c.id, i]));

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <h2 style={styles.sidebarTitle}>Comments ({comments.length})</h2>
      </div>
      <div style={styles.commentsList}>
        <CommentList
          renderComment={(comment, { onResolve, onDelete }) => {
            const index = commentIndexMap.get(comment.id) ?? 0;
            const color = getCommentColor(comment);
            const badgeColor = comment.resolved ? '#10b981' : color;
            return (
              <div style={styles.commentItem(!!comment.resolved, color)}>
                <div style={styles.commentHeader}>
                  <div>
                    <span style={styles.commentNumber(badgeColor)}>
                      {comment.resolved ? '\u2713' : index + 1}
                    </span>
                    <span style={styles.commentPosition}>
                      ({comment.x.toFixed(1)}%, {comment.y.toFixed(1)}%)
                    </span>
                  </div>
                  {comment.resolved && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontWeight: 500,
                      }}
                    >
                      Resolved
                    </span>
                  )}
                </div>
                <p style={styles.commentText}>{comment.text}</p>
                <div style={styles.commentActions}>
                  <button
                    style={styles.actionButton('resolve')}
                    onClick={onResolve}
                  >
                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                  </button>
                  <button
                    style={styles.actionButton('delete')}
                    onClick={onDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          }}
          sort={(a, b) => b.createdAt - a.createdAt}
          emptyState={
            <div style={styles.emptyState}>
              <p>No comments yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                Click "Annotate" and then click on the content to add one!
              </p>
            </div>
          }
        />
      </div>
    </aside>
  );
}

// Root App component
export default function App() {
  const adapter = useMemo(() => {
    return new MockAdapter('washi-demo-comments');
  }, []);

  return (
    <WashiProvider adapter={adapter}>
      <div style={styles.app}>
        <MainContent />
        <Sidebar />
      </div>
    </WashiProvider>
  );
}
