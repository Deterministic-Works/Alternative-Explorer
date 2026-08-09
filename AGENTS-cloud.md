# Alternative Explorer — cloud agent entry

Operational instructions for agents working from the Git remote (for example Cursor Cloud Agents).

If `AGENTS.md` exists on disk, prefer that file.

## Start work

1. Read this file.
2. Read `feature-plan.md` for intended product behavior. When a README, Obsidian manifest, or package manifest exists, read those for product, release, or build behavior.
3. Inspect `git status --short`, the relevant diff, and recent commits before editing.
4. Read the implementation files in scope before deciding on a change.
5. Preserve unrelated local changes.

## Knowledge ownership

| Kind | Source of truth |
|------|-----------------|
| Implementation behavior | TypeScript, CSS, configuration, and tests (when present) |
| Intended product features (pre-implementation) | `feature-plan.md` |
| Product behavior and installation | README (when present) |
| Plugin identity and release version | Obsidian manifest (when present) |
| Package version and build commands | Package manifest / scripts (when present) |
| Obsidian version compatibility | versions mapping file (when present) |

Do not invent durable product facts in agent notes when they belong in tracked code or public documentation.

## Commands

```bash
npm install       # install development dependencies
npm test          # run focused unit tests
npm run build     # type-check and produce the ignored main.js bundle
npm run dev       # rebuild main.js in watch mode
git diff --check  # check patch whitespace
```

Do not edit the generated `main.js` directly.

## Repository map

| Path | Role |
|------|------|
| `feature-plan.md` | Intended product features and interaction model (pre-implementation) |
| `src/main.ts` | Plugin lifecycle, view registration, persisted data, and vault events |
| `src/view.ts` | Folder tree, drill-down navigation, mode toggle, and file cards |
| `src/folder-order.ts` | Pure folder-order and path-remapping helpers |
| `styles.css` | Two-pane layout and Obsidian-native presentation |
| `manifest.json` | Plugin identity and Obsidian compatibility |
| `package.json` | Development dependencies and verified commands |
| `README.md` | User-facing behavior and local installation |
| `.gitignore` | Ignores build output and local-only agent/workflow files |

## Engineering guardrails

- Keep changes narrowly scoped. Prefer Obsidian plugin patterns once source exists.
- Do not invent build, test, or release commands; record them only after they exist and have been verified.
- Do not edit `node_modules/` or generated `main.js` when those appear.
- Keep tracked product docs accurate when user-visible behavior or installation changes.
- Keep plugin identity, package, and Obsidian compatibility version files synchronized when changing versions (once those files exist).
- Do not commit, push, tag, publish a release, change remotes, or transfer repositories unless the user explicitly requests it.
- Never add credentials or secrets to tracked files.

## Completion checks

1. Run verified build/test commands when implementation or build configuration changes; if none are established, say so.
2. Run `git diff --check`.
3. Review the complete scoped diff for unrelated changes, secrets, and stale URLs.
4. Report checks that were not run or did not pass.

## Cursor Cloud specific instructions

Durable, non-obvious notes for cloud agents. Standard commands live in the `## Commands` table above; do not duplicate them.

- Install with `npm install`, not `npm ci`. On the cloud VM's npm (10.9.x) `npm ci` fails with `EBADPLATFORM` on esbuild's optional platform packages (e.g. `@esbuild/aix-ppc64`). `npm install` resolves only the current platform's optional deps and works.
- `npm install` may show `package-lock.json` as modified (it strips `libc` fields the newer lockfile format added). This churn comes from the npm version difference, not from any code change — leave it out of commits.
- There is no linter/formatter configured. `git diff --check` (whitespace) is the only "lint" step.
- The Obsidian desktop app cannot run in the headless cloud VM, so there is no GUI/end-to-end runtime here. Verify changes with `npm test` (Vitest) and `npm run build` (tsc `--noEmit` + esbuild). The pure, unit-testable core lives in `src/folder-order.ts`; the Obsidian-coupled UI is in `src/view.ts` / `src/main.ts`.
- `main.js` is a generated, gitignored esbuild bundle — never edit it by hand. `npm run dev` watches `src/` and rebuilds `main.js` on save.
