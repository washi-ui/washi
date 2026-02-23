import React, { useEffect, useRef, IframeHTMLAttributes } from 'react';
import { useWashiContext } from './WashiProvider';

/**
 * Props for WashiFrame component
 */
export interface WashiFrameProps
  extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'ref'> {
  /** URL to load in the iframe */
  src: string;
  /** Optional: Additional CSS class name */
  className?: string;
  /** Optional: Inline styles */
  style?: React.CSSProperties;
}

/**
 * Iframe wrapper component that automatically registers with WashiProvider.
 * Must be used within a WashiProvider.
 *
 * @example
 * ```tsx
 * <WashiProvider adapter={adapter}>
 *   <WashiFrame
 *     src="/content.html"
 *     style={{ width: '100%', height: '600px', border: 'none' }}
 *   />
 * </WashiProvider>
 * ```
 */
export function WashiFrame({ src, className, style, ...props }: WashiFrameProps) {
  const { registerIframe } = useWashiContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      registerIframe(iframeRef.current);
    }

    return () => {
      registerIframe(null);
    };
  }, [registerIframe]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      className={className}
      style={style}
      {...props}
    />
  );
}
