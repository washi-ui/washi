---
'@washi-ui/react': patch
---

adds && iframe.contentDocument.URL !== 'about:blank' to the condition so handleLoad() is never called on the initial blank document. The load event will fire when the real src is ready, ensuring syncScroll attaches to the correct window.
