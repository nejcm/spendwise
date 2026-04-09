# Contributing to Spendwise

Thanks for helping improve Spendwise. This project uses a **proprietary license** ([`LICENSE`](LICENSE)): others may run the app for personal, non-commercial use, but may not modify, copy, or distribute the code **except** when contributing through the process below (including a host fork used only to open pull requests here). By opening a pull request or otherwise offering a contribution the maintainers accept, you agree to the **Contributing** and contribution-license terms in [`LICENSE`](LICENSE).

## Before you code

- For **large or risky changes** (new features, schema or architecture shifts), open an issue or draft PR first so direction and scope stay aligned.
- Read [`AGENTS.md`](AGENTS.md) for stack conventions, folder layout, and rules agents and contributors follow.

## Development setup

See [`.docs/setup.md`](.docs/setup.md): Node 20+, `pnpm`, `.env` from `.env.example`, and how to run `pnpm start` / `pnpm ios` / `pnpm android` / `pnpm web`.

## Branch and pull requests

- Use a **focused branch** per change; keep PRs reasonably small and reviewable.
- **Describe** what changed and why in the PR description; link related issues if any.
- Ensure **user-visible strings** go through i18n: add or update keys under `src/translations/` as needed.

## Code expectations

- TypeScript **strict**; prefer `@/` imports as in the rest of the repo.
- Keep route files under `src/app` thin; put logic in `src/features/...`.
- Finance data belongs in **SQLite** and flows through **React Query**; preferences use Zustand + MMKV.
- Style with **Uniwind** `className`; reuse `src/components/ui` where possible.
- Do not put app logic in `android/` or `ios/` native projects beyond what the stack already requires.

## Quality checks

Run before you push (especially for non-trivial changes):

```bash
pnpm lint
pnpm test
```

For broader confidence: `pnpm verify` (see [`.docs/setup.md`](.docs/setup.md)). Follow [`.docs/testing.md`](.docs/testing.md) for what to cover with Jest and when Maestro applies.

## Review process

Maintainers review for correctness, consistency with project conventions, and license fit. They may request changes or decline contributions that do not match project goals or licensing constraints.

## Conduct

Be respectful and constructive in issues and PRs. Harassment or abuse will not be tolerated.
