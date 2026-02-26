import { useState } from 'react';
import { useWashiContext } from './WashiProvider';
import { WashiToolBubble } from './WashiToolBubble';
import type { WashiToolBubblePosition } from './WashiToolBubble';
import { WashiCommentsSidebar } from './WashiCommentsSidebar';
import { WashiPinDialog } from './WashiPinDialog';

// Inject spinner keyframe once at module load
const SPINNER_ID = '__washi-ui-spinner__';
if (typeof document !== 'undefined' && !document.getElementById(SPINNER_ID)) {
  const style = document.createElement('style');
  style.id = SPINNER_ID;
  style.textContent = `@keyframes __washi-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export interface WashiUIProps {
  /** Corner where the tool bubble (and sidebar) are anchored. Default: 'bottom-right' */
  position?: WashiToolBubblePosition;
  accentColor?: string;
  /** Show a loading spinner while the iframe initialises. Default: true */
  showLoader?: boolean;
}

/**
 * All-in-one Washi UI layer.
 *
 * Renders the tool bubble, comments sidebar, pin dialog, and an optional
 * loading overlay — all wired together. Drop it inside a `<WashiProvider>`.
 *
 * @example
 * ```tsx
 * <WashiProvider adapter={adapter}>
 *   <div style={{ position: 'fixed', inset: 0 }}>
 *     <WashiFrame src="/content.html" style={{ width: '100%', height: '100%', border: 'none' }} />
 *   </div>
 *   <WashiUI />
 * </WashiProvider>
 * ```
 */
export function WashiUI({
  position = 'bottom-right',
  accentColor = '#667eea',
  showLoader = true,
}: WashiUIProps) {
  const { isReady } = useWashiContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Loading overlay */}
      {showLoader && !isReady && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid #e5e7eb',
              borderTopColor: accentColor,
              animation: '__washi-spin 1s linear infinite',
            }}
          />
        </div>
      )}

      <WashiToolBubble
        position={position}
        accentColor={accentColor}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
      />

      <WashiCommentsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        position={position}
        accentColor={accentColor}
      />

      <WashiPinDialog accentColor={accentColor} />
    </>
  );
}
