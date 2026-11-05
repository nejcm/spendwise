# Coding Standards

| Rule | Enforced by |
|---|---|
| Verify UI changes in the browser pane (`spendwise-web`) before calling them done | Nothing — `AGENTS.md` › Commands |
| pnpm `trustPolicy` / Expo Doctor blocks are reported, never bypassed via `trustPolicy` or `expo.install.exclude` | Nothing — `AGENTS.md` › Blast radius |
| Jest skips agent worktrees only relative to the repo root | `jest.config.js` (`<rootDir>/.claude/`) |
