// Set test environment flag
process.env.NODE_ENV = 'test';

// Polyfill requestAnimationFrame for jsdom - execute synchronously
let rafId = 0;
globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  callback(performance.now());
  return ++rafId;
};

globalThis.cancelAnimationFrame = (): void => {
  // No-op in test environment
};
