import { WashiAdapter, Comment } from '@washi-ui/core';

/**
 * Adapter that persists comments to localStorage.
 * Useful for demos, prototypes, and single-user scenarios.
 *
 * @example
 * ```typescript
 * const adapter = new LocalStorageAdapter('my-page-comments');
 * const washi = new Washi(adapter);
 * ```
 */
export class LocalStorageAdapter implements WashiAdapter {
  private comments = new Map<string, Comment>();
  private storageKey: string;

  constructor(storageKey = 'washi-comments') {
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const comments: Comment[] = JSON.parse(stored);
        comments.forEach((comment) => {
          this.comments.set(comment.id, comment);
        });
      }
    } catch {
      // localStorage unavailable (SSR, private browsing, quota exceeded)
    }
  }

  private saveToStorage(): void {
    try {
      const comments = Array.from(this.comments.values());
      localStorage.setItem(this.storageKey, JSON.stringify(comments));
    } catch {
      // localStorage unavailable or quota exceeded
    }
  }

  async save(comment: Comment): Promise<void> {
    this.comments.set(comment.id, comment);
    this.saveToStorage();
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
    this.saveToStorage();
  }

  async delete(id: string): Promise<void> {
    if (!this.comments.has(id)) {
      throw new Error(`Comment ${id} not found`);
    }
    this.comments.delete(id);
    this.saveToStorage();
  }

  /**
   * Clear all stored comments and remove from localStorage.
   * Useful for resetting state in tests or demos.
   */
  clear(): void {
    this.comments.clear();
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }
}
