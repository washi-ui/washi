import { WashiAdapter, Comment } from '@washi-ui/core';

/**
 * Mock adapter that persists comments to localStorage.
 * Useful for demos and prototyping.
 */
export class MockAdapter implements WashiAdapter {
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
    } catch (error) {
      console.warn('MockAdapter: Failed to load from localStorage', error);
    }
  }

  private saveToStorage(): void {
    try {
      const comments = Array.from(this.comments.values());
      localStorage.setItem(this.storageKey, JSON.stringify(comments));
    } catch (error) {
      console.warn('MockAdapter: Failed to save to localStorage', error);
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
    const updated = { ...existing, ...updates };
    this.comments.set(id, updated);
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
   * Clear all comments (useful for testing)
   */
  clear(): void {
    this.comments.clear();
    localStorage.removeItem(this.storageKey);
  }
}
