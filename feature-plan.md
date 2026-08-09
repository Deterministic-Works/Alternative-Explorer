# Alternative Explorer — feature plan

Obsidian plugin: a file explorer alternative with drill-down navigation, folder-only expansion, and a card-style file list.

Source note: 2026-08-24.

## Goals

Replace (or sit beside) the default file explorer with a view that:

- Treats folders as navigable destinations, not only accordion rows
- Keeps the folder tree focused on structure (folders), not files
- Surfaces files as larger, readable cards with light metadata

## Features

### 1. Customizable folder order

- Folders can be ordered manually (not only by name / modified time).
- Order is persisted across sessions.

### 2. Drill-down folder navigation

- Clicking a folder opens that folder’s contents in the main list (like a traditional OS file browser).
- This is the primary interaction — not in-place tree expansion like Obsidian’s default explorer.

### 3. Folder-only tree expansion

- Folders can still be expanded in a tree/sidebar sense.
- Expansion reveals **subfolders only**, never files.
- Files appear only in the content/list pane after navigating into a folder.

### 4. Shallow vs recursive file listing (toggle)

When viewing a folder, a toggle chooses what files appear:

| Mode | Files shown |
|------|-------------|
| Direct children | Files immediately under the current folder |
| Recursive | All files under the current folder, including nested subfolders |

### 5. Card-style file list

- Files render as cards slightly larger than default explorer rows.
- Each card shows:
  - **Title** (primary line)
  - **Modified date** (second line: smaller, less emphasized)

## Interaction model (summary)

```
Folder tree          Content pane
─────────────        ────────────────────────────
expand → subfolders  click folder → drill in
                     toggle → shallow | recursive files
                     cards → title + modified date
```

## Out of scope (for now)

Not specified in the source note; leave undecided until later:

- Sorting / filtering of the file card list
- Search
- File operations (rename, move, delete, new note)
- Replacing vs coexisting with Obsidian’s built-in explorer
- Mobile-specific layout
