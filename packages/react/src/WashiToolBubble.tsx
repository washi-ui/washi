import { useState } from 'react';
import { useWashiContext } from './WashiProvider';

export type WashiToolBubblePosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface WashiToolBubbleProps {
  position?: WashiToolBubblePosition;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  accentColor?: string;
}

const positionStyles: Record<WashiToolBubblePosition, React.CSSProperties> = {
  'bottom-right': { bottom: 24, right: 24 },
  'bottom-left': { bottom: 24, left: 24 },
  'top-right': { top: 24, right: 24 },
  'top-left': { top: 24, left: 24 },
};

// Pencil icon SVG
function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Chat bubble icon SVG
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function WashiToolBubble({
  position = 'bottom-right',
  sidebarOpen = false,
  onSidebarToggle,
  accentColor = '#667eea',
}: WashiToolBubbleProps) {
  const { mode, setMode, isReady, comments } = useWashiContext();
  const [hoveredBtn, setHoveredBtn] = useState<'pencil' | 'chat' | null>(null);

  const isAnnotate = mode === 'annotate';
  const commentCount = comments.length;
  const badgeLabel = commentCount > 99 ? '99+' : String(commentCount);

  const pillStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.06)',
  };

  const btnBase: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s, box-shadow 0.15s, color 0.15s',
    outline: 'none',
  };

  const pencilActive = isAnnotate;
  const pencilDisabled = !isReady;

  const pencilStyle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: pencilActive
      ? accentColor
      : hoveredBtn === 'pencil'
        ? 'rgba(0,0,0,0.06)'
        : 'transparent',
    color: pencilActive ? '#fff' : '#374151',
    opacity: pencilDisabled ? 0.5 : 1,
    cursor: pencilDisabled ? 'not-allowed' : 'pointer',
    boxShadow: pencilActive
      ? `0 0 0 3px ${accentColor}33`
      : 'none',
  };

  const chatStyle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: sidebarOpen
      ? 'rgba(0,0,0,0.06)'
      : hoveredBtn === 'chat'
        ? 'rgba(0,0,0,0.06)'
        : 'transparent',
    color: '#374151',
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: '999px',
    backgroundColor: accentColor,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    lineHeight: 1,
    pointerEvents: 'none',
  };

  return (
    <div style={pillStyle}>
      <button
        style={pencilStyle}
        disabled={pencilDisabled}
        title={isAnnotate ? 'Exit annotate mode' : 'Enter annotate mode'}
        onClick={() => !pencilDisabled && setMode(isAnnotate ? 'view' : 'annotate')}
        onMouseEnter={() => setHoveredBtn('pencil')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        <PencilIcon />
      </button>
      <button
        style={chatStyle}
        title={sidebarOpen ? 'Close comments' : 'Open comments'}
        onClick={onSidebarToggle}
        onMouseEnter={() => setHoveredBtn('chat')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        <ChatIcon />
        {commentCount > 0 && (
          <span style={badgeStyle}>{badgeLabel}</span>
        )}
      </button>
    </div>
  );
}
