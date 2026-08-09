# Alternative Explorer — feature plan

Obsidian plugin: a calm, Apple Notes–style sidebar explorer with a single pane that switches between an expandable folder tree and a notes list.

Source note: 2026-08-24; updated for expandable folder tree + note depth toggle.

## Goals

Replace (or sit beside) the default file explorer with a left-sidebar view that:

- Shows folders as an expandable tree in one pane (not drill-down into a child-only list)
- Lets any folder (including nested ones) open that folder’s notes in the same pane
- Groups notes with configurable sort/group controls and optional pinned bookmarks

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

### 4. Readable, configurable notes list

- Sort controls in the notes pane: **Name**, **Modified**, or **Created**, each ascending or descending.
- Group-by controls: **None**, **Modified**, or **Created**.
  - Modified/Created use recency sections: Today, Yesterday, Previous 7 Days, Previous 30 Days, older months (`MMMM YYYY`).
  - Empty sections are omitted.
- Separate **Pinned** toggle: when on, bookmarked notes appear in a **Pinned** section first; when off, they stay in normal groups (still marked with a pin icon).
- Nested note location is shown when listing recursively or under **All notes**.
- Selecting a note opens it in the main editor leaf.
- Right-click a note to **Pin** / **Unpin** (toggles a core Bookmarks file bookmark; requires Bookmarks enabled).

### 5. Sidebar presentation

- Opens in the left sidebar by default.
- Visuals inherit the active Obsidian theme: transparent pane background, `--nav-item-*` colors/hover/active states, no plugin-owned surface colors.
- Folder rows are compact and indented by depth, matching the native file explorer density.

## Interaction model (summary)

1. Folders pane: All notes + expandable vault tree; drag to reorder siblings.
2. Chevron → expand/collapse; folder body → notes pane for that folder.
3. Notes pane: Back → folders; This folder / All below toggle; Sort / Group / Pinned controls; tap note → editor; right-click note → Pin/Unpin.

## Out of scope (for now)

The initial implementation leaves these for later:

- Search
- File operations (rename, move, delete, new note)
- Replacing Obsidian’s built-in explorer (the initial view coexists with it)
- Mobile-specific interactions beyond responsive sidebar density
