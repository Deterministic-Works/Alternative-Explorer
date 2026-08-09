# Alternative Explorer — feature plan

Obsidian plugin: a calm, Apple Notes–style sidebar explorer with a single pane that switches between folders and notes.

Source note: 2026-08-24; updated for sidebar pane-switch UX.

## Goals

Replace (or sit beside) the default file explorer with a left-sidebar view that:

- Treats folders as destinations that open a notes list (not accordion rows)
- Switches the same pane between a folder list and a notes list (no stacked two-layer panel)
- Groups notes by pinned/bookmarks and recency for easy scanning

## Features

### 1. Customizable folder order

- Folders can be ordered manually (not only by name / modified time).
- Order is changed by drag and drop and persisted across sessions.

### 2. Single-pane folder ↔ notes switching

- The folders pane lists destinations only (never note rows).
- At vault root, **All notes** appears first; vault folders follow.
- Notes that live in the vault root appear only under **All notes**, not in the folders pane.
- Tapping a folder opens that folder’s notes list in the same pane.
- The chevron on a folder drills into its subfolder list (folders pane stays active).
- Back from the notes pane returns to the folders pane.

### 3. Readable, dated notes list

- Notes for a folder are that folder’s direct child files only.
- **All notes** lists every vault file.
- Sections (by modified time), empty ones omitted:
  - **Pinned** — files bookmarked in Obsidian’s core Bookmarks plugin
  - **Today**
  - **Yesterday**
  - **Previous 7 Days**
  - **Previous 30 Days**
  - Older months (`MMMM YYYY`)
- Within a section, newest-first.
- Selecting a note opens it in the main editor leaf.

### 4. Sidebar presentation

- Opens in the left sidebar by default.
- Layout is dense and narrow (sidebar chrome), not a centered document page.

## Interaction model (summary)

1. Folders pane: Back/breadcrumbs for nested folder navigation; All notes + folders at root.
2. Folder body → notes pane for that folder; chevron → drill into subfolders.
3. Notes pane: Back → folders; Pinned + recency sections; tap note → editor.

## Out of scope (for now)

The initial implementation leaves these for later:

- User-configurable sorting / filtering of the note list
- Search
- File operations (rename, move, delete, new note)
- Replacing Obsidian’s built-in explorer (the initial view coexists with it)
- Mobile-specific interactions beyond responsive sidebar density
