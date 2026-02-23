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
