/**
 * @washi-ui/react
 *
 * React bindings for the Washi HTML commenting engine
 */

// Hook
export { useWashi } from './useWashi';
export type { UseWashiOptions, UseWashiReturn } from './useWashi';

// Provider pattern
export { WashiProvider, useWashiContext } from './WashiProvider';
export type { WashiProviderProps, WashiContextValue } from './WashiProvider';

// Components
export { WashiFrame } from './WashiFrame';
export type { WashiFrameProps } from './WashiFrame';

export { CommentList } from './CommentList';
export type { CommentListProps } from './CommentList';

// Floating UI components (primitives)
export { WashiToolBubble } from './WashiToolBubble';
export type { WashiToolBubbleProps, WashiToolBubblePosition } from './WashiToolBubble';

export { WashiCommentsSidebar } from './WashiCommentsSidebar';
export type { WashiCommentsSidebarProps } from './WashiCommentsSidebar';

export { WashiPinDialog } from './WashiPinDialog';
export type { WashiPinDialogProps } from './WashiPinDialog';

// All-in-one compound component
export { WashiUI } from './WashiUI';
export type { WashiUIProps } from './WashiUI';

// Re-export core types for convenience
export type {
  Comment,
  NewComment,
  WashiMode,
  WashiEvent,
  WashiAdapter,
  MountOptions,
  PinPlacedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  CommentClickedEvent,
  ModeChangedEvent,
  ErrorEvent,
} from '@washi-ui/core';
