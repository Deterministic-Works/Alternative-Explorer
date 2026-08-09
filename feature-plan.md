# Alternative Explorer — feature plan

Obsidian plugin: a calm, Apple Notes–style sidebar explorer with a single pane that switches between an expandable folder tree and a notes list.

Source note: 2026-08-24; updated for expandable folder tree + note depth toggle.

## Goals

Replace (or sit beside) the default file explorer with a left-sidebar view that:

- Shows folders as an expandable tree in one pane (not drill-down into a child-only list)
- Lets any folder (including nested ones) open that folder’s notes in the same pane
- Groups notes by pinned/bookmarks and recency for easy scanning

## Features

### 1. Customizable folder order

- Folders can be ordered manually (not only by name / modified time).
- Order is changed by drag and drop among siblings and persisted across sessions.

### 2. Expandable folder tree + notes switching

- The folders pane always lists the vault from the root as a tree.
- **All notes** appears first; vault folders follow.
- Chevron expands/collapses subfolders inline in the same list (persisted).
- Tapping a folder (at any depth) opens that folder’s notes list in the same pane.
- Back from the notes pane returns to the folders pane (tree expansion state preserved).

### 3. Note depth toggle

When viewing a folder’s notes, a toggle chooses depth:

| Mode | Files shown |
|------|-------------|
| This folder | Files immediately under the selected folder |
| All below | All files under the selected folder, including nested subfolders |

- **All notes** still lists every vault file (toggle hidden).

### 4. Readable, dated notes list

- Sections (by modified time), empty ones omitted:
  - **Pinned** — files bookmarked in Obsidian’s core Bookmarks plugin
  - **Today**
  - **Yesterday**
  - **Previous 7 Days**
  - **Previous 30 Days**
  - Older months (`MMMM YYYY`)
- Within a section, newest-first.
- Nested note location is shown when listing recursively or under **All notes**.
- Selecting a note opens it in the main editor leaf.

### 5. Sidebar presentation

- Opens in the left sidebar by default.
- Visuals inherit the active Obsidian theme: transparent pane background, `--nav-item-*` colors/hover/active states, no plugin-owned surface colors.
- Folder rows are compact and indented by depth, matching the native file explorer density.

## Interaction model (summary)

1. Folders pane: All notes + expandable vault tree; drag to reorder siblings.
2. Chevron → expand/collapse; folder body → notes pane for that folder.
3. Notes pane: Back → folders; This folder / All below toggle; Pinned + recency sections; tap note → editor.

## Out of scope (for now)

The initial implementation leaves these for later:

- User-configurable sorting / filtering of the note list
- Search
- File operations (rename, move, delete, new note)
- Replacing Obsidian’s built-in explorer (the initial view coexists with it)
- Mobile-specific interactions beyond responsive sidebar density
