# Contributing to Washi UI

Thank you for your interest in contributing! This document covers how to set up the project locally, submit bug reports, and open pull requests.

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8 — install with `npm install -g pnpm`

## Local Setup

```bash
git clone https://github.com/washi-ui/washi.git
cd washi-ui
pnpm install
pnpm build
```

## Development

```bash
# Run the dev sandbox (live-reloads against local packages)
pnpm --filter @washi-ui/demo dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Typecheck all packages
pnpm lint

# Watch mode for a specific package
pnpm --filter @washi-ui/core dev
```

## Submitting a Bug Report

Open an issue using the **Bug Report** template. Include:

- The package and version where you hit the bug
- A minimal reproduction — a CodeSandbox or StackBlitz link is ideal
- What you expected to happen vs. what actually happened

## Requesting a Feature

Open an issue using the **Feature Request** template. Describe the problem you're trying to solve before proposing a solution — this helps spark better discussion.

## Opening a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes — keep PRs focused on a single concern
3. Add or update tests if you're changing runtime behaviour
4. Update the relevant `README.md` if the public API changes
5. Run `pnpm changeset` and follow the prompts to describe your change — this is **required** for any user-facing fix or feature (not needed for docs-only or chore changes)
6. Open the PR and fill in the template

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and the CHANGELOG. When your PR includes a user-facing change:

```bash
pnpm changeset
# Select the affected package(s), choose patch/minor/major, write a summary
# Commit the generated .changeset/*.md file with your PR
```

The release workflow will automatically bump versions and publish to npm when the generated "Version Packages" PR is merged.

## Code Style

- TypeScript strict mode throughout
- No new runtime dependencies without prior discussion in an issue
- Prefer editing existing files over creating new abstractions
- Tests live next to the source: `src/__tests__/`

## Questions

If something is unclear, open a [discussion](https://github.com/washi-ui/washi/discussions) or drop a comment on the relevant issue.
