import { WashiAdapter, Comment } from '@washi-ui/core';

/**
 * In-memory adapter with no persistence.
 * Comments are lost on page reload.
 *
 * Ideal for:
 * - Unit tests and integration tests
 * - Server-side rendering environments where localStorage is unavailable
 * - Ephemeral annotation sessions
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const washi = new Washi(adapter);
 * ```
 */
export class MemoryAdapter implements WashiAdapter {
  private comments = new Map<string, Comment>();

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment);
  }

  async load(): Promise<Comment[]> {
    return Array.from(this.comments.values());
  }

  async update(id: string, updates: Partial<Comment>): Promise<void> {
    const existing = this.comments.get(id);
    if (!existing) {
      throw new Error(`Comment ${id} not found`);
    }
    this.comments.set(id, { ...existing, ...updates });
  }

  async delete(id: string): Promise<void> {
    if (!this.comments.has(id)) {
      throw new Error(`Comment ${id} not found`);
    }
    this.comments.delete(id);
  }

  /**
   * Clear all in-memory comments.
   * Useful for resetting state between tests.
   */
  clear(): void {
    this.comments.clear();
  }

  /**
   * Pre-seed the adapter with comments.
   * Useful for initializing test state.
   */
  seed(comments: Comment[]): void {
    comments.forEach((c) => this.comments.set(c.id, c));
  }
}
