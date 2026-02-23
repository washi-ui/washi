import React, { ReactNode } from 'react';
import { Comment } from '@washi-ui/core';
import { useWashiContext } from './WashiProvider';

/**
 * Props for CommentList component
 */
export interface CommentListProps {
  /**
   * Render function for each comment.
   * Receives the comment and action handlers.
   */
  renderComment: (
    comment: Comment,
    actions: {
      onResolve: () => Promise<void>;
      onDelete: () => Promise<void>;
      onUpdate: (updates: Partial<Comment>) => Promise<void>;
    },
  ) => ReactNode;
  /**
   * Optional: Filter function to show only certain comments
   */
  filter?: (comment: Comment) => boolean;
  /**
   * Optional: Sort function for comments
   */
  sort?: (a: Comment, b: Comment) => number;
  /**
   * Optional: Component to render when there are no comments
   */
  emptyState?: ReactNode;
  /**
   * Optional: CSS class name for the list container
   */
  className?: string;
  /**
   * Optional: Inline styles for the list container
   */
  style?: React.CSSProperties;
}

/**
 * Helper component for rendering a list of comments.
 * Must be used within a WashiProvider.
 *
 * @example
 * ```tsx
 * <CommentList
 *   renderComment={(comment, { onResolve, onDelete }) => (
 *     <div key={comment.id} className="comment-item">
 *       <p>{comment.text}</p>
 *       <div className="actions">
 *         <button onClick={onResolve}>
 *           {comment.resolved ? 'Unresolve' : 'Resolve'}
 *         </button>
 *         <button onClick={onDelete}>Delete</button>
 *       </div>
 *     </div>
 *   )}
 *   filter={(c) => !c.resolved}
 *   sort={(a, b) => b.createdAt - a.createdAt}
 *   emptyState={<p>No comments yet</p>}
 * />
 * ```
 */
export function CommentList({
  renderComment,
  filter,
  sort,
  emptyState,
  className,
  style,
}: CommentListProps) {
  const { comments, updateComment, deleteComment } = useWashiContext();

  let displayComments = [...comments];

  if (filter) {
    displayComments = displayComments.filter(filter);
  }

  if (sort) {
    displayComments.sort(sort);
  }

  if (displayComments.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className} style={style}>
      {displayComments.map((comment) => {
        const actions = {
          onResolve: async () => {
            await updateComment(comment.id, { resolved: !comment.resolved });
          },
          onDelete: async () => {
            await deleteComment(comment.id);
          },
          onUpdate: async (updates: Partial<Comment>) => {
            await updateComment(comment.id, updates);
          },
        };

        return (
          <React.Fragment key={comment.id}>
            {renderComment(comment, actions)}
          </React.Fragment>
        );
      })}
    </div>
  );
}
