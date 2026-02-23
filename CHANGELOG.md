# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-25

### Added

- Initial release of `@washi-ui/core`
  - Pin-based commenting system for iframes
  - View and annotate modes
  - Event system for comment lifecycle
  - Adapter pattern for pluggable storage
  - Scroll synchronization
  - Coordinate validation (0-100%)
  - Mount options (readOnly, theme)
  - Full TypeScript support with JSDoc documentation

- Initial release of `@washi-ui/react`
  - `useWashi` hook for simple integration
  - `WashiProvider` for context-based state sharing
  - `WashiFrame` component for auto-registration
  - `CommentList` helper component
  - Re-exported core types for convenience

### Documentation

- Comprehensive README files for all packages
- JSDoc documentation for all public APIs
- Demo application with MockAdapter
