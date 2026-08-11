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
| `src/create-paths.ts` | Pure helpers for unique note/folder vault paths |
| `src/view.ts` | Sidebar folders/notes pane switching and note rows |
| `src/note-groups.ts` | Pure pinned/recency grouping for the notes list |
| `src/bookmarks.ts` | Core Bookmarks plugin file-path reader |
| `src/folder-order.ts` | Pure folder-order and path-remapping helpers |
| `src/folder-sections.ts` | Pure folder-section partition, sort, and membership helpers |
| `src/smart-folders.ts` | Pure smart-folder rule matching helpers |
| `src/smart-folder-modal.ts` | Create/edit UI for smart folders |
| `src/confirm-modal.ts` | Confirm dialog for destructive actions |
| `styles.css` | Narrow sidebar layout and Obsidian-native presentation |
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
