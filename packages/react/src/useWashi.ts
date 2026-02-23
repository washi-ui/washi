import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Washi,
  WashiAdapter,
  WashiMode,
  Comment,
  NewComment,
  MountOptions,
  PinPlacedEvent,
} from '@washi-ui/core';

/**
 * Options for the useWashi hook
 */
export interface UseWashiOptions {
  /** Required: The storage adapter for persisting comments */
  adapter: WashiAdapter;
  /** Optional: Initial mode ('view' or 'annotate'). Defaults to 'view' */
  initialMode?: WashiMode;
  /** Optional: Mount options for the Washi instance */
  mountOptions?: MountOptions;
  /** Optional: Callback when a pin is placed on the overlay in annotate mode */
  onPinPlaced?: (event: PinPlacedEvent) => void;
  /** Optional: Callback when a pin is clicked */
  onCommentClick?: (comment: Comment) => void;
  /** Optional: Callback when a comment is updated */
  onCommentUpdate?: (data: { id: string; updates: Partial<Comment> }) => void;
  /** Optional: Callback when a comment is deleted */
  onCommentDelete?: (id: string) => void;
}

/**
 * Return type of the useWashi hook
 */
export interface UseWashiReturn {
  /** Ref to attach to the iframe element */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Current mode */
  mode: WashiMode;
  /** Function to change the mode */
  setMode: (mode: WashiMode) => void;
  /** Array of all comments */
  comments: Comment[];
  /** Add a new comment. Returns the completed Comment with generated id and createdAt. */
  addComment: (input: NewComment) => Promise<Comment>;
  /** Update an existing comment */
  updateComment: (id: string, updates: Partial<Comment>) => Promise<void>;
  /** Delete a comment */
  deleteComment: (id: string) => Promise<void>;
  /** Whether the Washi instance is mounted and ready */
  isReady: boolean;
  /** Any error that occurred during mounting or operations */
  error: Error | null;
}

/**
 * React hook for using Washi comment system.
 *
 * @param options - Configuration options
 * @returns Object with iframe ref, state, and methods
 *
 * @example
 * ```tsx
 * function CommentableContent() {
 *   const {
 *     iframeRef,
 *     mode,
 *     setMode,
 *     comments,
 *     addComment,
 *     isReady
 *   } = useWashi({
 *     adapter: new MyAdapter(),
 *     onPinPlaced: ({ x, y }) => {
 *       // Show comment input dialog at position
 *     },
 *     onCommentClick: (comment) => {
 *       // Show comment details
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => setMode(mode === 'view' ? 'annotate' : 'view')}>
 *         Toggle Mode
 *       </button>
 *       <div style={{ position: 'relative' }}>
 *         <iframe ref={iframeRef} src="/content.html" />
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWashi(options: UseWashiOptions): UseWashiReturn {
  const {
    adapter,
    initialMode = 'view',
    mountOptions,
    onPinPlaced,
    onCommentClick,
    onCommentUpdate,
    onCommentDelete,
  } = options;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const washiRef = useRef<Washi | null>(null);

  const [mode, setModeState] = useState<WashiMode>(initialMode);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Washi instance
  useEffect(() => {
    washiRef.current = new Washi(adapter);
    return () => {
      washiRef.current?.unmount();
      washiRef.current = null;
    };
  }, [adapter]);

  // Mount to iframe when available
  useEffect(() => {
    const iframe = iframeRef.current;
    const washi = washiRef.current;

    if (!iframe || !washi) return;

    const handleLoad = async () => {
      try {
        await washi.mount(iframe, mountOptions);
        setComments(washi.getComments());
        if (initialMode !== 'view') {
          washi.setMode(initialMode);
        }
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsReady(false);
      }
    };

    // If iframe is already loaded, mount immediately
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    } else {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [mountOptions, initialMode]);

  // Subscribe to events
  useEffect(() => {
    const washi = washiRef.current;
    if (!washi || !isReady) return;

    const unsubscribers: (() => void)[] = [];

    if (onPinPlaced) {
      unsubscribers.push(
        washi.on('pin:placed', (event: PinPlacedEvent) => {
          onPinPlaced(event);
        }),
      );
    }

    if (onCommentClick) {
      unsubscribers.push(
        washi.on('comment:clicked', (comment: Comment) => {
          onCommentClick(comment);
        }),
      );
    }

    if (onCommentUpdate) {
      unsubscribers.push(
        washi.on(
          'comment:updated',
          (data: { id: string; updates: Partial<Comment> }) => {
            onCommentUpdate(data);
          },
        ),
      );
    }

    if (onCommentDelete) {
      unsubscribers.push(
        washi.on('comment:deleted', (id: string) => {
          onCommentDelete(id);
        }),
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isReady, onPinPlaced, onCommentClick, onCommentUpdate, onCommentDelete]);

  const setMode = useCallback((newMode: WashiMode) => {
    const washi = washiRef.current;
    if (!washi) return;

    try {
      washi.setMode(newMode);
      setModeState(newMode);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const addComment = useCallback(async (input: NewComment): Promise<Comment> => {
    const washi = washiRef.current;
    if (!washi) throw new Error('Washi is not initialized');

    const comment = await washi.addComment(input);
    setComments(washi.getComments());
    return comment;
  }, []);

  const updateComment = useCallback(
    async (id: string, updates: Partial<Comment>) => {
      const washi = washiRef.current;
      if (!washi) throw new Error('Washi is not initialized');

      await washi.updateComment(id, updates);
      setComments(washi.getComments());
    },
    [],
  );

  const deleteComment = useCallback(async (id: string) => {
    const washi = washiRef.current;
    if (!washi) throw new Error('Washi is not initialized');

    await washi.deleteComment(id);
    setComments(washi.getComments());
  }, []);

  return {
    iframeRef,
    mode,
    setMode,
    comments,
    addComment,
    updateComment,
    deleteComment,
    isReady,
    error,
  };
}
