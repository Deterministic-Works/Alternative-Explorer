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

No build or test command is established yet. The repository currently holds planning material only; plugin source, package manifests, and scripts have not been added.

When a Node/Obsidian plugin scaffold lands, document verified commands here from evidence.

Documentation-only changes: run `git diff --check`.

## Repository map

| Path | Role |
|------|------|
| `feature-plan.md` | Intended product features and interaction model (pre-implementation) |
| `.gitignore` | Ignores build output and local-only agent/workflow files |

Plugin source, manifests, and build tooling are not present yet. Expand this map when the scaffold lands.

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
