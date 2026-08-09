# Alternative Explorer — feature plan

Obsidian plugin: a calm, single-panel file explorer with drill-down folder navigation and a readable note list.

Source note: 2026-08-24.

## Goals

Replace (or sit beside) the default file explorer with a view that:

- Treats folders as navigable destinations, not only accordion rows
- Keeps folders and notes in one continuous browser instead of splitting them into panes
- Surfaces notes as compact, readable rows with light metadata

## Features

### 1. Customizable folder order

- Folders can be ordered manually (not only by name / modified time).
- Order is changed by drag and drop and persisted across sessions.

### 2. Drill-down folder navigation

- Clicking a folder opens that folder’s contents in the main list (like a traditional OS file browser).
- This is the primary interaction — not in-place tree expansion like Obsidian’s default explorer.

### 3. Single-panel folder list

- The current folder's direct subfolders appear first as destination rows.
- Files follow in the same panel; there is no permanent folder tree or sidebar.
- Back navigation and breadcrumbs expose the current location without duplicating the hierarchy.

### 4. Shallow vs recursive file listing (toggle)

When viewing a folder, a toggle chooses what files appear:

| Mode | Files shown |
|------|-------------|
| Direct children | Files immediately under the current folder |
| Recursive | All files under the current folder, including nested subfolders |

### 5. Readable file list

- Files render as compact, full-width rows that scan cleanly without wasting space.
- Each row shows:
  - **Title** (primary line)
  - **Modified date** (secondary, less emphasized)

## Interaction model (summary)

1. Breadcrumbs and Back establish location.
2. Folder rows drill into direct subfolders and can be dragged to reorder.
3. The depth toggle switches the note list between direct and recursive results.
4. Note rows show title and modified date and open the selected note.

## Out of scope (for now)

The initial implementation leaves these for later:

- User-configurable sorting / filtering of the note list
- Search
- File operations (rename, move, delete, new note)
- Replacing Obsidian’s built-in explorer (the initial view coexists with it)
- Mobile-specific interactions beyond a responsive single-column layout
