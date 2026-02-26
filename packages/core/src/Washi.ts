/**
 * Washi - A library for pin-based HTML commenting
 *
 * Responsibilities:
 * - Attach to an iframe containing HTML
 * - Render visual pins on an overlay
 * - Handle click interactions (add comments)
 * - Delegate storage to adapter
 * - Emit events to notify host application
 * - Switch between view/comment modes
 */

import {
  Comment,
  NewComment,
  MountOptions,
  WashiAdapter,
  WashiEvent,
  WashiMode,
} from './types';

/**
 * Default color palette for pins
 */
const WASHI_COLORS = [
  '#667eea', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
];

/**
 * Washi is a pin-based HTML commenting engine that overlays
 * interactive comment pins on iframe content.
 *
 * @example
 * ```typescript
 * const adapter = new MyAdapter();
 * const washi = new Washi(adapter);
 *
 * await washi.mount(iframeElement);
 * washi.setMode('annotate');
 *
 * washi.on('pin:placed', ({ x, y }) => {
 *   // Handle new comment at position
 * });
 * ```
 */
export class Washi {
  private adapter: WashiAdapter;
  private iframe?: HTMLIFrameElement;
  private overlay?: HTMLDivElement;
  private dialog?: HTMLDivElement;
  private comments: Map<string, Comment>;
  private mode: WashiMode;
  private pins: Map<string, HTMLElement>;
  private eventHandlers: Map<WashiEvent, Set<Function>>;
  private boundHandleOverlayClick?: (event: MouseEvent) => void;
  private boundSyncScroll?: () => void;
  private boundHandleWheel?: (event: WheelEvent) => void;
  private options?: MountOptions;
  private contentReady: boolean = false;
  private activePinId?: string;
  private mountGeneration = 0;

  /**
   * Creates a new Washi instance with the specified adapter.
   *
   * @param adapter - The storage adapter for persisting comments.
   *                  Must implement the WashiAdapter interface.
   *
   * @example
   * ```typescript
   * const adapter = new LocalStorageAdapter();
   * const washi = new Washi(adapter);
   * ```
   */
  constructor(adapter: WashiAdapter) {
    this.adapter = adapter;
    this.comments = new Map();
    this.mode = 'view';
    this.pins = new Map();
    this.eventHandlers = new Map();
  }

  private throttle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
  ): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    }) as T;
  }

  private validateCoordinates(x: number, y: number): void {
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      throw new Error('Coordinates must be between 0-100');
    }
  }

  /**
   * Waits for iframe content dimensions to stabilize.
   * This prevents pin position drift when content loads asynchronously.
   */
  private async waitForContentReady(): Promise<void> {
    this.contentReady = true;

    // Skip in non-browser environments or if no iframe content
    if (typeof window === 'undefined' || !this.iframe?.contentDocument) {
      return;
    }

    // In browsers, wait for content to stabilize
    const getContentSize = () => {
      const doc = this.iframe?.contentDocument?.documentElement;
      return {
        width: doc?.scrollWidth || 0,
        height: doc?.scrollHeight || 0,
      };
    };

    // Wait for next frame
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    let lastSize = getContentSize();
    let stableCount = 0;

    for (let i = 0; i < 10; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const currentSize = getContentSize();

      if (
        currentSize.width === lastSize.width &&
        currentSize.height === lastSize.height &&
        currentSize.width > 0 &&
        currentSize.height > 0
      ) {
        stableCount++;
        if (stableCount >= 2) return;
      } else {
        stableCount = 0;
      }
      lastSize = currentSize;
    }
  }

  /**
   * Mounts the comment system to an iframe element.
   * This is an async operation that loads existing comments from the adapter.
   *
   * @param iframe - The iframe element containing HTML to comment on
   * @param options - Optional mount configuration
   * @throws Error if already mounted (call unmount() first)
   * @throws Error if iframe is not attached to the DOM
   *
   * @example
   * ```typescript
   * const iframe = document.querySelector('iframe');
   * await washi.mount(iframe);
   *
   * // With options
   * await washi.mount(iframe, { readOnly: true });
   * ```
   */
  async mount(iframe: HTMLIFrameElement, options?: MountOptions): Promise<void> {
    if (this.iframe) {
      throw new Error('iframe already mounted. Unmount first.');
    }
    if (!iframe.parentElement) {
      throw new Error('No iframe attacted to the DOM.');
    }

    const generation = ++this.mountGeneration;

    this.iframe = iframe;
    this.options = options;

    const parent = iframe.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    this.overlay = this.createOverlay();
    parent.appendChild(this.overlay);

    this.setupEventListeners();

    // Wait for content dimensions to stabilize before rendering pins
    await this.waitForContentReady();

    // Bail out if unmount() was called while we were awaiting
    if (this.mountGeneration !== generation) return;

    // Update overlay dimensions after content is ready
    this.updateOverlayDimensions();

    try {
      const comments = await this.adapter.load();

      // Bail out if unmount() was called while the adapter was loading
      if (this.mountGeneration !== generation) return;

      comments.forEach((comment) => {
        this.comments.set(comment.id, comment);
        this.renderPin(comment);
      });
    } catch (error) {
      this.emit('error', {
        type: 'load',
        message: 'Failed to load comments',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Updates the overlay dimensions to match the iframe content.
   * Call this if content size changes after mount.
   */
  private updateOverlayDimensions(): void {
    if (!this.iframe || !this.overlay) return;

    const contentWidth =
      this.iframe.contentDocument?.documentElement.scrollWidth || 0;
    const contentHeight =
      this.iframe.contentDocument?.documentElement.scrollHeight || 0;

    this.overlay.style.width = `${contentWidth}px`;
    this.overlay.style.height = `${contentHeight}px`;
  }

  /**
   * Refreshes all pin positions based on current content dimensions.
   * Useful when content size changes after initial render.
   */
  refreshPinPositions(): void {
    if (!this.iframe || !this.overlay) return;

    this.updateOverlayDimensions();

    // Remove all existing pins from the DOM
    const commentsToRerender: Comment[] = [];
    this.pins.forEach((pin, id) => {
      pin.remove();
      const comment = this.comments.get(id);
      if (comment) {
        commentsToRerender.push(comment);
      }
    });
    this.pins.clear();

    // Re-render all pins with updated positions
    commentsToRerender.forEach((comment) => {
      this.renderPin(comment);
    });
  }

  /**
   * Gets the zero-based index of a comment when sorted by createdAt.
   *
   * @param commentId - The comment ID to find the index for
   * @returns The index, or -1 if not found
   */
  getCommentIndex(commentId: string): number {
    const sortedComments = Array.from(this.comments.values()).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    return sortedComments.findIndex((c) => c.id === commentId);
  }

  /**
   * Sets the active pin for highlighting purposes.
   * Only one pin can be active at a time.
   *
   * @param commentId - The comment ID to set as active, or null to clear
   */
  setActivePin(commentId: string | null): void {
    // Remove active state from previous pin
    if (this.activePinId) {
      const prevPin = this.pins.get(this.activePinId);
      if (prevPin) {
        prevPin.removeAttribute('data-washi-active');
      }
    }

    this.activePinId = commentId ?? undefined;

    // Add active state to new pin
    if (commentId) {
      const newPin = this.pins.get(commentId);
      if (newPin) {
        newPin.setAttribute('data-washi-active', 'true');
      }
    }
  }

  /**
   * Shows the pin dialog for a specific comment.
   *
   * @param commentId - The comment ID to show the dialog for
   */
  showPinDialog(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment || !this.overlay) return;

    // Hide existing dialog
    this.hidePinDialog();

    // Set this pin as active
    this.setActivePin(commentId);

    const pin = this.pins.get(commentId);
    if (!pin) return;

    const index = this.getCommentIndex(commentId);
    const color = comment.color || WASHI_COLORS[0];

    // Create dialog element
    const dialog = document.createElement('div');
    dialog.className = 'washi-dialog';
    dialog.setAttribute('data-washi-dialog', '');
    dialog.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 12px;
      min-width: 200px;
      max-width: 280px;
      z-index: 10000;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Position dialog near pin
    const pinRect = pin.getBoundingClientRect();
    let dialogX = parseFloat(pin.style.left) + 20;
    const dialogY = parseFloat(pin.style.top) - 10;

    // Adjust if too close to right edge
    if (pinRect.left + 300 > window.innerWidth) {
      dialogX = parseFloat(pin.style.left) - 220;
    }

    dialog.style.left = `${dialogX}px`;
    dialog.style.top = `${dialogY}px`;

    // Header
    const header = document.createElement('div');
    header.className = 'washi-dialog-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const numberBadge = document.createElement('span');
    numberBadge.className = 'washi-dialog-number';
    numberBadge.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${color};
      color: white;
      font-size: 12px;
      font-weight: 600;
    `;
    numberBadge.textContent = String(index + 1);

    const closeButton = document.createElement('button');
    closeButton.className = 'washi-dialog-close';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      line-height: 1;
    `;
    closeButton.textContent = '×';
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hidePinDialog();
    });

    header.appendChild(numberBadge);
    header.appendChild(closeButton);

    // Content
    const content = document.createElement('div');
    content.className = 'washi-dialog-content';
    content.style.cssText = `margin-bottom: 12px;`;

    const text = document.createElement('p');
    text.className = 'washi-dialog-text';
    text.style.cssText = `
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.4;
    `;
    text.textContent = comment.text;

    const meta = document.createElement('span');
    meta.className = 'washi-dialog-meta';
    meta.style.cssText = `
      font-size: 12px;
      color: #9ca3af;
    `;
    meta.textContent = `(${comment.x.toFixed(1)}%, ${comment.y.toFixed(1)}%)`;

    content.appendChild(text);
    content.appendChild(meta);

    // Color picker
    const colors = document.createElement('div');
    colors.className = 'washi-dialog-colors';
    colors.style.cssText = `
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    `;

    WASHI_COLORS.forEach((swatchColor) => {
      const swatch = document.createElement('button');
      swatch.className = 'washi-dialog-color';
      swatch.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid ${swatchColor === color ? '#1f2937' : 'transparent'};
        background-color: ${swatchColor};
        cursor: pointer;
        padding: 0;
      `;
      if (swatchColor === color) {
        swatch.setAttribute('data-selected', 'true');
      }
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateCommentColor(commentId, swatchColor);
      });
      colors.appendChild(swatch);
    });

    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(colors);

    // Prevent clicks on dialog from closing it
    dialog.addEventListener('click', (e) => e.stopPropagation());

    this.overlay.appendChild(dialog);
    this.dialog = dialog;

    // Close dialog when clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (!dialog.contains(e.target as Node) && !pin.contains(e.target as Node)) {
        this.hidePinDialog();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
  }

  /**
   * Hides the currently shown pin dialog.
   */
  hidePinDialog(): void {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = undefined;
    }
    this.setActivePin(null);
  }

  /**
   * Updates the color of a comment's pin.
   *
   * @param commentId - The comment ID to update
   * @param color - The new color for the pin
   */
  async updateCommentColor(commentId: string, color: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    // Update via the normal update flow
    await this.updateComment(commentId, { color });

    // Refresh the dialog to show new color
    this.showPinDialog(commentId);
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');

    overlay.className = 'washi-overlay';

    const contentWidth =
      this.iframe?.contentDocument?.documentElement.scrollWidth || 0;
    const contentHeight =
      this.iframe?.contentDocument?.documentElement.scrollHeight || 0;

    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${contentWidth}px;
      height: ${contentHeight}px;
      pointer-events: ${this.mode === 'annotate' ? 'auto' : 'none'};
      z-index: 9999;
    `;

    return overlay;
  }

  private setupEventListeners(): void {
    if (!this.iframe || !this.overlay) return;

    this.boundHandleOverlayClick = (event: MouseEvent) => {
      this.handleOverlayClick(event);
    };

    this.overlay.addEventListener('click', this.boundHandleOverlayClick);

    this.boundHandleWheel = (event: WheelEvent) => {
      if (this.iframe?.contentWindow) {
        this.iframe.contentWindow.scrollBy(event.deltaX, event.deltaY);
        event.preventDefault();
      }
    };
    this.overlay.addEventListener('wheel', this.boundHandleWheel, { passive: false });

    this.syncScroll();
  }

  private renderPin(comment: Comment): void {
    if (!this.iframe) return;

    const contentWidth =
      this.iframe.contentDocument?.documentElement.scrollWidth || 0;
    const contentHeight =
      this.iframe.contentDocument?.documentElement.scrollHeight || 0;

    // Convert percentage to absolute pixels in full content
    const absoluteX = (comment.x / 100) * contentWidth;
    const absoluteY = (comment.y / 100) * contentHeight;

    const index = this.getCommentIndex(comment.id);
    const isActive = this.activePinId === comment.id;
    const isResolved = !!comment.resolved;

    // Get pin color: use comment color or default from palette
    const color = comment.color || WASHI_COLORS[0];

    const pin = document.createElement('div');
    pin.className = 'washi-pin';
    pin.style.cssText = `
      width: 24px;
      height: 24px;
      background-color: ${isResolved ? '#10b981' : color};
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      border: 2px solid white;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #fff;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: ${isResolved ? '0.5' : '1'};
    `;
    pin.textContent = isResolved ? '\u2713' : String(index + 1);

    // Add data attributes
    pin.setAttribute('data-washi-comment-id', comment.id);
    pin.setAttribute('data-washi-index', String(index));
    if (isActive) {
      pin.setAttribute('data-washi-active', 'true');
    }
    if (isResolved) {
      pin.setAttribute('data-washi-resolved', 'true');
    }

    // Position the pin
    pin.style.position = 'absolute';
    pin.style.top = `${absoluteY}px`;
    pin.style.left = `${absoluteX}px`;
    pin.style.transform = 'translate(-50%, -50%)';
    pin.style.cursor = 'pointer';

    pin.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      if (!this.options?.disableBuiltinDialog) {
        this.showPinDialog(comment.id);
      }
      this.emit('comment:clicked', { comment });
    });

    this.overlay!.appendChild(pin);
    this.pins.set(comment.id, pin);
  }

  private emit(event: WashiEvent, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler: `, error);
      }
    });
  }

  private handleOverlayClick(event: MouseEvent): void {
    if (this.mode !== 'annotate') return;
    if (!this.iframe || !this.overlay?.getBoundingClientRect()) return;

    const overlayRect = this.overlay.getBoundingClientRect();

    const clickX = event.clientX - overlayRect.left;
    const clickY = event.clientY - overlayRect.top;

    const contentWidth =
      this.iframe.contentDocument?.documentElement.scrollWidth || overlayRect.width;
    const contentHeight =
      this.iframe.contentDocument?.documentElement.scrollHeight || overlayRect.height;

    const percentX = Math.min(100, Math.max(0, (clickX / contentWidth) * 100));
    const percentY = Math.min(100, Math.max(0, (clickY / contentHeight) * 100));

    this.emit('pin:placed', { x: percentX, y: percentY });
  }

  private syncScroll(): void {
    if (!this.iframe || !this.overlay) return;
    const iframeWindow = this.iframe.contentWindow;
    if (!iframeWindow) {
      return;
    }

    const handleScroll = () => {
      const scrollX = iframeWindow.scrollX;
      const scrollY = iframeWindow.scrollY;

      if (this.overlay) {
        this.overlay.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
      }
    };

    this.boundSyncScroll = this.throttle(handleScroll, 16);
    iframeWindow.addEventListener('scroll', this.boundSyncScroll);
  }

  /**
   * Unmounts the comment system and cleans up all resources.
   * Safe to call multiple times - subsequent calls have no effect.
   *
   * @example
   * ```typescript
   * washi.unmount();
   * // Can now mount to a different iframe
   * await washi.mount(newIframe);
   * ```
   */
  unmount(): void {
    // Invalidate any in-flight mount() continuation
    this.mountGeneration++;

    if (this.boundHandleOverlayClick && this.overlay) {
      this.overlay.removeEventListener('click', this.boundHandleOverlayClick);
    }

    if (this.boundSyncScroll && this.iframe?.contentWindow) {
      this.iframe.contentWindow.removeEventListener(
        'scroll',
        this.boundSyncScroll,
      );
    }

    if (this.boundHandleWheel && this.overlay) {
      this.overlay.removeEventListener('wheel', this.boundHandleWheel);
    }

    // Clean up dialog
    this.hidePinDialog();

    this.overlay?.remove();

    this.pins.clear();
    this.comments.clear();
    this.iframe = undefined;
    this.overlay = undefined;
    this.dialog = undefined;
    this.contentReady = false;
    this.activePinId = undefined;
    this.boundHandleOverlayClick = undefined;
    this.boundSyncScroll = undefined;
    this.boundHandleWheel = undefined;
  }

  /**
   * Adds a new comment and renders its pin on the overlay.
   * The library generates `id` and `createdAt` automatically.
   * The comment is validated, persisted to the adapter, and a pin is rendered.
   *
   * @param input - The comment data to add. `id` and `createdAt` are generated by the library.
   * @returns The completed Comment object with generated `id` and `createdAt`.
   * @throws Error if not mounted
   * @throws Error if input.text is missing
   * @throws Error if coordinates are outside 0-100 range
   * @throws Error if adapter fails to save (changes are rolled back)
   *
   * @example
   * ```typescript
   * const comment = await washi.addComment({
   *   x: 50,
   *   y: 25,
   *   text: 'Review this section',
   * });
   * console.log(comment.id); // auto-generated UUID
   * ```
   */
  async addComment(input: NewComment): Promise<Comment> {
    if (!this.iframe)
      throw new Error('Washi is not mounted. Call mount() first.');
    if (!input.text) throw new Error('Invalid comment');
    this.validateCoordinates(input.x, input.y);

    const comment: Comment = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    this.comments.set(comment.id, comment);
    this.renderPin(comment);

    try {
      await this.adapter.save(comment);
      this.emit('comment:created', comment);
    } catch (error) {
      this.comments.delete(comment.id);
      this.pins.get(comment.id)?.remove();
      this.pins.delete(comment.id);

      throw new Error(`Washi: Failed to save comment: ${error}`);
    }

    return comment;
  }

  /**
   * Updates an existing comment with partial data.
   * If position (x, y) or color is updated, the pin is re-rendered.
   *
   * @param id - The ID of the comment to update
   * @param updates - Partial comment data to merge
   * @throws Error if comment does not exist
   * @throws Error if new coordinates are outside 0-100 range
   *
   * @example
   * ```typescript
   * // Update text
   * await washi.updateComment('comment-1', { text: 'Updated text' });
   *
   * // Mark as resolved
   * await washi.updateComment('comment-1', { resolved: true });
   *
   * // Move position
   * await washi.updateComment('comment-1', { x: 75, y: 50 });
   *
   * // Change color
   * await washi.updateComment('comment-1', { color: '#ef4444' });
   * ```
   */
  async updateComment(id: string, updates: Partial<Comment>): Promise<void> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error('Washi: Comment does not exist');
    }

    if (updates.x !== undefined || updates.y !== undefined) {
      const x = updates.x ?? comment.x;
      const y = updates.y ?? comment.y;
      this.validateCoordinates(x, y);
    }

    const updated = { ...comment, ...updates };

    await this.adapter.update(id, updates);

    this.comments.set(id, updated);

    // Re-render pin if position, color, or resolved state changed
    if (updates.x !== undefined || updates.y !== undefined || updates.color !== undefined || updates.resolved !== undefined) {
      const pin = this.pins.get(id);
      if (pin) {
        pin.remove();
        this.pins.delete(id);
      }
      this.renderPin(updated);
    }

    this.emit('comment:updated', { id, updates });
  }

  /**
   * Deletes a comment and removes its pin from the overlay.
   *
   * @param id - The ID of the comment to delete
   * @throws Error if not mounted
   * @throws Error if comment does not exist
   * @throws Error if adapter fails to delete
   *
   * @example
   * ```typescript
   * await washi.deleteComment('comment-1');
   * ```
   */
  async deleteComment(id: string): Promise<void> {
    if (!this.iframe)
      throw new Error('Washi is not mounted. Call mount() first.');

    if (!this.comments.has(id)) throw new Error('Washi: Comment not found');

    try {
      await this.adapter.delete(id);
      this.comments.delete(id);

      // Hide dialog if it's showing this comment
      if (this.activePinId === id) {
        this.hidePinDialog();
      }

      const pin = this.pins.get(id);
      if (pin) {
        pin.remove();
        this.pins.delete(id);
      }

      // Re-render remaining pins so indices update
      this.refreshPinPositions();

      this.emit('comment:deleted', { id });
    } catch (error) {
      throw new Error(`Washi: Failed to delete comment: ${error}`);
    }
  }

  /**
   * Returns all comments as an array of shallow copies.
   * Modifications to returned objects will not affect internal state.
   *
   * @returns Array of comment objects
   *
   * @example
   * ```typescript
   * const comments = washi.getComments();
   * const unresolvedCount = comments.filter(c => !c.resolved).length;
   * ```
   */
  getComments(): Comment[] {
    return Array.from(this.comments.values()).map((c) => ({ ...c }));
  }

  /**
   * Returns whether the Washi instance is mounted and content is ready.
   *
   * @returns true if mounted and content dimensions are stable
   */
  isReady(): boolean {
    return this.contentReady && !!this.iframe;
  }

  /**
   * Sets the current interaction mode.
   * Emits 'mode:changed' event with mode and previousMode.
   *
   * - 'view': Pins are clickable, overlay doesn't capture clicks
   * - 'annotate': Clicking overlay creates new comment positions
   *
   * @param mode - The mode to set ('view' or 'annotate')
   * @throws Error if mode is not 'view' or 'annotate'
   * @throws Error if readOnly option is set and mode is 'annotate'
   *
   * @example
   * ```typescript
   * // Enable annotation mode
   * washi.setMode('annotate');
   *
   * // Switch back to view mode
   * washi.setMode('view');
   * ```
   */
  setMode(mode: WashiMode): void {
    if (mode !== 'view' && mode !== 'annotate') {
      throw new Error('Invalid mode');
    }

    if (this.options?.readOnly && mode === 'annotate') {
      throw new Error('Cannot set annotate mode in readOnly mode');
    }

    const previousMode = this.mode;
    this.mode = mode;
    this.emit('mode:changed', { mode, previousMode });

    if (this.overlay) {
      this.overlay.style.pointerEvents = mode === 'annotate' ? 'auto' : 'none';
    }
  }

  /**
   * Subscribes to a Washi event. Returns an unsubscribe function.
   *
   * Available events:
   * - 'pin:placed': Fired when overlay is clicked in annotate mode (provides { x, y })
   * - 'comment:created': Fired after addComment() succeeds (provides full Comment)
   * - 'comment:updated': Fired after updateComment() succeeds
   * - 'comment:deleted': Fired after deleteComment() succeeds
   * - 'comment:clicked': Fired when a pin is clicked (provides full comment)
   * - 'mode:changed': Fired after setMode() (provides mode, previousMode)
   * - 'error': Fired when an internal error occurs (provides { type, message, error })
   *
   * @param event - The event name to subscribe to
   * @param handler - The callback function to invoke
   * @returns An unsubscribe function to remove the handler
   *
   * @example
   * ```typescript
   * // Subscribe to events
   * const unsubscribe = washi.on('comment:clicked', (comment) => {
   *   console.log('Clicked comment:', comment.id);
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  on(event: WashiEvent, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    const handlers = this.eventHandlers.get(event)!;

    handlers.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
}
