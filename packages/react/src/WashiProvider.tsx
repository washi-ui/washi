import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
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
 * Context value provided by WashiProvider
 */
export interface WashiContextValue {
  /** The Washi instance (null if not mounted) */
  washi: Washi | null;
  /** The registered iframe element (null if not mounted) */
  iframeEl: HTMLIFrameElement | null;
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
  /** Refresh comments from adapter */
  refreshComments: () => void;
  /** Whether the Washi instance is mounted and ready */
  isReady: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Register an iframe element for mounting */
  registerIframe: (iframe: HTMLIFrameElement | null) => void;
  /** Subscribe to pin placement events (overlay clicked in annotate mode) */
  onPinPlaced: (callback: (event: PinPlacedEvent) => void) => () => void;
  /** Subscribe to comment click events */
  onCommentClick: (callback: (comment: Comment) => void) => () => void;
  /** Set the active pin for highlighting */
  setActivePin: (commentId: string | null) => void;
  /** Get the index of a comment (sorted by createdAt) */
  getCommentIndex: (commentId: string) => number;
  /** Currently selected/active comment (for custom dialog rendering) */
  activeComment: Comment | null;
  /** Set the active comment (for custom dialog rendering) */
  setActiveComment: (comment: Comment | null) => void;
}

const WashiContext = createContext<WashiContextValue | null>(null);

/**
 * Props for WashiProvider
 */
export interface WashiProviderProps {
  /** Required: The storage adapter for persisting comments */
  adapter: WashiAdapter;
  /** Optional: Initial mode ('view' or 'annotate'). Defaults to 'view' */
  initialMode?: WashiMode;
  /** Optional: Mount options for the Washi instance */
  mountOptions?: MountOptions;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component for Washi context.
 * Use with WashiFrame and useWashiContext.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <WashiProvider adapter={new MyAdapter()}>
 *       <WashiFrame src="/content.html" />
 *       <CommentSidebar />
 *     </WashiProvider>
 *   );
 * }
 * ```
 */
export function WashiProvider({
  adapter,
  initialMode = 'view',
  mountOptions,
  children,
}: WashiProviderProps) {
  // Create Washi instance synchronously to avoid race conditions
  const washiRef = useRef<Washi | null>(null);
  if (!washiRef.current) {
    washiRef.current = new Washi(adapter);
  }

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Stores cleanup for the current iframe's 'load' listener so it can be
  // removed when registerIframe(null) is called (required for React StrictMode).
  const iframeLoadCleanupRef = useRef<(() => void) | null>(null);
  // Stores unsubscribe functions for Washi event listeners so they can be
  // removed before each remount cycle.
  const washiEventCleanupsRef = useRef<Array<() => void>>([]);

  const pinPlacedCallbacksRef = useRef<Set<(event: PinPlacedEvent) => void>>(
    new Set(),
  );
  const clickCallbacksRef = useRef<Set<(comment: Comment) => void>>(new Set());

  const [mode, setModeState] = useState<WashiMode>(initialMode);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeComment, setActiveCommentState] = useState<Comment | null>(null);
  const [iframeElState, setIframeElState] = useState<HTMLIFrameElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      washiRef.current?.unmount();
    };
  }, []);

  const refreshComments = useCallback(() => {
    const washi = washiRef.current;
    if (washi) {
      setComments(washi.getComments());
    }
  }, []);

  const registerIframe = useCallback(
    (iframe: HTMLIFrameElement | null): void => {
      // Always tear down the previous load listener and Washi event subscriptions.
      // This makes the effect symmetric so React StrictMode's setup→cleanup→setup
      // cycle works correctly (each setup gets a clean slate).
      iframeLoadCleanupRef.current?.();
      iframeLoadCleanupRef.current = null;

      washiEventCleanupsRef.current.forEach((fn) => fn());
      washiEventCleanupsRef.current = [];

      iframeRef.current = iframe;
      setIframeElState(iframe);

      if (!iframe) {
        // Unmount Washi so the next registerIframe(iframe) call can re-mount cleanly.
        if (washiRef.current) {
          washiRef.current.unmount();
          setIsReady(false);
          setComments([]);
        }
        return;
      }

      if (!washiRef.current) return;

      const washi = washiRef.current;

      const handleLoad = async () => {
        try {
          await washi.mount(iframe, mountOptions);

          // Bail out if this mount cycle was already cancelled (registerIframe(null)
          // was called while we were awaiting — e.g. StrictMode cleanup).
          if (iframeRef.current !== iframe) return;

          setComments(washi.getComments());
          if (initialMode !== 'view') {
            washi.setMode(initialMode);
          }
          setIsReady(true);
          setError(null);

          // Subscribe to events — store unsubscribes for cleanup
          washiEventCleanupsRef.current.push(
            washi.on('pin:placed', (event: PinPlacedEvent) => {
              pinPlacedCallbacksRef.current.forEach((cb) => cb(event));
            }),
          );

          washiEventCleanupsRef.current.push(
            washi.on('comment:clicked', (comment: Comment) => {
              clickCallbacksRef.current.forEach((cb) => cb(comment));
            }),
          );

          washiEventCleanupsRef.current.push(
            washi.on('comment:updated', () => {
              setComments(washi.getComments());
            }),
          );

          washiEventCleanupsRef.current.push(
            washi.on('comment:deleted', () => {
              setComments(washi.getComments());
            }),
          );
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsReady(false);
        }
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        handleLoad();
      } else {
        iframe.addEventListener('load', handleLoad);
        iframeLoadCleanupRef.current = () =>
          iframe.removeEventListener('load', handleLoad);
      }
    },
    [mountOptions, initialMode],
  );

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

  const onPinPlaced = useCallback(
    (callback: (event: PinPlacedEvent) => void) => {
      pinPlacedCallbacksRef.current.add(callback);
      return () => {
        pinPlacedCallbacksRef.current.delete(callback);
      };
    },
    [],
  );

  const onCommentClick = useCallback(
    (callback: (comment: Comment) => void) => {
      clickCallbacksRef.current.add(callback);
      return () => {
        clickCallbacksRef.current.delete(callback);
      };
    },
    [],
  );

  const setActivePin = useCallback((commentId: string | null) => {
    const washi = washiRef.current;
    if (washi) {
      washi.setActivePin(commentId);
    }
  }, []);

  const getCommentIndex = useCallback((commentId: string) => {
    const washi = washiRef.current;
    if (washi) {
      return washi.getCommentIndex(commentId);
    }
    return -1;
  }, []);

  const setActiveComment = useCallback((comment: Comment | null) => {
    setActiveCommentState(comment);
    const washi = washiRef.current;
    if (washi) {
      washi.setActivePin(comment?.id ?? null);
    }
  }, []);

  const value = useMemo<WashiContextValue>(
    () => ({
      washi: washiRef.current,
      iframeEl: iframeElState,
      mode,
      setMode,
      comments,
      addComment,
      updateComment,
      deleteComment,
      refreshComments,
      isReady,
      error,
      registerIframe,
      onPinPlaced,
      onCommentClick,
      setActivePin,
      getCommentIndex,
      activeComment,
      setActiveComment,
    }),
    [
      iframeElState,
      mode,
      setMode,
      comments,
      addComment,
      updateComment,
      deleteComment,
      refreshComments,
      isReady,
      error,
      registerIframe,
      onPinPlaced,
      onCommentClick,
      setActivePin,
      getCommentIndex,
      activeComment,
      setActiveComment,
    ],
  );

  return (
    <WashiContext.Provider value={value}>{children}</WashiContext.Provider>
  );
}

/**
 * Hook to access Washi context.
 * Must be used within a WashiProvider.
 *
 * @throws Error if used outside of WashiProvider
 *
 * @example
 * ```tsx
 * function CommentSidebar() {
 *   const { comments, deleteComment } = useWashiContext();
 *
 *   return (
 *     <ul>
 *       {comments.map(c => (
 *         <li key={c.id}>
 *           {c.text}
 *           <button onClick={() => deleteComment(c.id)}>Delete</button>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useWashiContext(): WashiContextValue {
  const context = useContext(WashiContext);
  if (!context) {
    throw new Error('useWashiContext must be used within a WashiProvider');
  }
  return context;
}
