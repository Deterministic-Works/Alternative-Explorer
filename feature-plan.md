# Alternative Explorer — feature plan

Obsidian plugin: a calm, Apple Notes–style sidebar explorer with a single pane that switches between an expandable folder tree and a notes list.

Source note: 2026-08-24; updated for expandable folder tree + note depth toggle; updated for folder sections and folder sort; updated for smart folders and reveal current note; updated for settings defaults and per-folder sort overrides.

## Goals

Replace (or sit beside) the default file explorer with a left-sidebar view that:

- Shows folders as an expandable tree in one pane (not drill-down into a child-only list)
- Lets any folder (including nested ones) open that folder’s notes in the same pane
- Groups notes with configurable sort/group controls and optional pinned bookmarks
- Groups root folders into plugin-only sections with configurable in-section sort
- Supports plugin-only smart folders filtered by note properties
- Can reveal the currently open note in the explorer notes list
- Lets users set default sort in Settings and per-folder/scope overrides in the explorer

## Features

### 1. Customizable folder order and sort

- Default folder sort (**Name**, **Modified**, **Created**, or **Custom**) lives in **Settings → Alternative Explorer**.
- The folders header sort control sets a persisted override for vault-root children (applied inside each section and the unassigned list).
- Opening a real folder’s notes view exposes a folder-sort control that overrides how that folder’s children are ordered.
- Custom order is changed by drag and drop when the effective sort for that parent is **Custom**, and is persisted across sessions.
- Nested sibling folders use the same sort modes via the parent’s override or the settings default.
- **Use default** clears a folder’s override so the settings default applies again.

### 2. Plugin-only folder sections

- Named sections group root folders for display only (not vault folders).
- Unassigned root folders appear as a loose list (no header) after **All notes** and before named sections.
- Sections are ordered manually (drag headers); open by default; chevron collapses/expands (persisted).
- Create from the folders header; assign via context menu or drag; rename/delete from section context menu.

### 3. Expandable folder tree + notes switching

- The folders pane always lists the vault from the root as a tree.
- **All notes** appears first; vault folders and smart folders follow (unassigned, then sections).
- Chevron expands/collapses subfolders inline in the same list (persisted).
- Tapping a folder (at any depth) opens that folder’s notes list in the same pane.
- Back from the notes pane returns to the folders pane (tree expansion state preserved).

### 4. Note depth toggle

When viewing a folder’s notes, an icon toggle next to the title chooses depth:

| Mode | Files shown |
|------|-------------|
| This folder | Files immediately under the selected folder |
| All below | All files under the selected folder, including nested subfolders |

- **All notes** still lists every vault file (toggle hidden).
- Sort / group / pinned controls sit right-aligned on the same header row.

### 5. Readable, configurable notes list

- Default note sort (**Name**, **Modified**, or **Created**, ascending or descending) lives in **Settings → Alternative Explorer**.
- Sort controls in the notes pane set a persisted override for the current scope (**All notes**, a folder path, or a smart folder). **Use default** clears the override.
- Group-by controls: **None**, **Modified**, or **Created** (still global).
  - Modified/Created use recency sections: Today, Yesterday, Previous 7 Days, Previous 30 Days, older months (`MMMM YYYY`).
  - Empty sections are omitted.
- Separate **Pinned** toggle: when on, bookmarked notes appear in a **Pinned** section first; when off, they stay in normal groups (still marked with a pin icon).
- Nested note location is shown when listing recursively or under **All notes**.
- Each note row shows the date under the title (compact padding so titles are not truncated).
- Selecting a note opens it in the main editor leaf.
- Right-click a note to **Pin** / **Unpin** (toggles a core Bookmarks file bookmark; requires Bookmarks enabled).

### 6. Smart folders

- Plugin-only virtual folders appear in the folders list among real folders (not vault folders).
- Smart folders can be dragged to reorder among siblings, assigned to sections at the root, or nested under a real folder (middle-of-row drop, or drag beside nested siblings).
- Each smart folder has a name, All/Any match mode, and one or more rules over:
  - Frontmatter properties
  - Tags
  - Built-ins: name, path, created, modified, pinned
- Operators: equals, not equals, contains, not contains, starts with, ends with, exists, not exists; date fields also support before / after / on (`YYYY-MM-DD`).
- Date fields also support **within** plus relative presets: today, yesterday, last 7/30 days, this/last week, this/last month (or a custom `YYYY-MM-DD` / `N-days-ago`).
- For **within**, Custom days accepts any last-N-days count (for example 14).
- **Pinned** rules use a single state control: is pinned / is not pinned (from core Bookmarks file bookmarks).
- Empty rules match no notes.
- Create from the folders header; right-click to edit rules, rename, move (section / root), or delete.
- Opening a smart folder shows matching vault notes in the notes pane (depth toggle hidden; parent paths shown).

### 7. Reveal current note

- Header button on folders and notes panes.
- Opens the active note’s parent-folder notes list (`All notes` for vault-root notes), with depth set to this folder only.
- Scrolls to the note row and briefly highlights it.
- Shows a notice when there is no active note, or when the note is not present in the resulting list.

### 8. Create note and folder

- Header buttons on the folders pane: **New note** and **New folder** (create at the vault root).
- Header buttons on the notes pane: **New note** always; **New folder** when viewing **All notes** or a real folder (hidden on smart folders).
- New note creates `Untitled.md` (or the next free `Untitled N.md`), opens it in the editor, and from the folders pane switches into that folder’s notes list.
- New folder prompts for a name (default `Untitled`) and creates under the current target parent (vault root from the folders pane / All notes; the open folder from a folder notes list).

### 9. Sidebar presentation

- Opens in the left sidebar by default.
- Visuals inherit the active Obsidian theme: transparent pane background, `--nav-item-*` colors/hover/active states, no plugin-owned surface colors.
- Folder rows are compact and indented by depth, matching the native file explorer density.
- **All notes** and smart folders use the same icon column as folder rows; smart folders sort and nest with real folders.

## Interaction model (summary)

1. Folders pane: All notes + unassigned root folders/smart folders + named sections; Reveal / New note / New folder / New smart folder / New section / Sort in header (root folder-sort override); drag to reorder when effective sort is Custom, or reassign; drag smart folders among real folders or into a folder to nest; drag section headers to reorder sections.
2. Chevron → expand/collapse folder or section; folder body → notes pane for that folder; smart folder → filtered notes pane.
3. Notes pane: Back → folders; Reveal current note; New note; New folder (hidden on smart folders); icon depth toggle (This folder / All below) for real folders; folder-sort control (real folders) plus note Sort / Group / Pinned; Sort writes a per-scope override with Use default; tap note → editor; right-click note → Pin/Unpin.
4. Settings → Alternative Explorer: default folder sort and default note sort.
5. Smart folder context menu → Edit rules / Rename / Move (section or root) / Delete.

## Out of scope (for now)

The initial implementation leaves these for later:

- Search
- File operations beyond create (rename, move, delete)
- Replacing Obsidian’s built-in explorer (the initial view coexists with it)
- Mobile-specific interactions beyond responsive sidebar density
- Nesting smart folders under other smart folders