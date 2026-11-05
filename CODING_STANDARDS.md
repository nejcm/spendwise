# Coding Standards

| Rule | Enforced by |
|---|---|
| Verify UI changes in the browser pane (`spendwise-web`) before calling them done | Nothing — `AGENTS.md` › Commands |
| pnpm `trustPolicy` / Expo Doctor blocks are reported, never bypassed via `trustPolicy` or `expo.install.exclude` | Nothing — `AGENTS.md` › Blast radius |
| ESLint disable comments use antfu rule names (`react/exhaustive-deps`, not `react-hooks/…`) | ESLint "Definition for rule … was not found" (pre-commit); pointer in `AGENTS.md` › Conventions |
| Jest skips agent worktrees only relative to the repo root | `jest.config.js` (`<rootDir>/.claude/`) |
