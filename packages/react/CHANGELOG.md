# @washi-ui/react

## 1.0.3

### Patch Changes

- 664932b: Fix bouncy scroll sync on iOS by replacing throttle with requestAnimationFrame.

  Fix `addComment` throwing on non-secure HTTP contexts (e.g. LAN network hosts) by replacing `crypto.randomUUID()` with a fallback UUID generator.

  Fix pin dialog "Add" button not responding to clicks by switching the overlay to view mode as soon as a pin is placed, preventing the annotate-mode overlay from intercepting pointer events while the dialog is open.

- Updated dependencies [664932b]
  - @washi-ui/core@1.0.2

## 1.0.2

### Patch Changes

- 5efb428: Fix (WashiProvider.tsx): replaced the simple readyState === 'complete' check with a pendingNavigation guard that detects when contentDocument is still about:blank but iframe.src points to a real URL. In that case, mounting is deferred to the load event so syncScroll always attaches to the correct window.

  Tests (WashiProvider.test.tsx):

  - Regression test: mocks the about:blank + real src state (the exact production race condition), asserts isReady is false before load and true after — if the guard is ever removed, this test fails.
  - Backward compat test: confirms that an iframe with no src (genuine about:blank) still mounts immediately without needing a load event.

## 1.0.1

### Patch Changes

- Updated dependencies [325ce63]
  - @washi-ui/core@1.0.1
