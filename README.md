# Alternative Explorer

Alternative Explorer is an Obsidian plugin for browsing a vault in an Apple Notes–style left sidebar. One pane switches between a folder list and a dated notes list. It coexists with Obsidian's built-in file explorer.

## Features

- Open in the left sidebar from the ribbon or **Alternative Explorer: Open explorer view**.
- Browse an expandable folder tree; chevron expands nested folders inline, and tapping a folder opens its notes.
- Group root folders into plugin-only sections (not vault folders). Unassigned folders and smart folders stay in a loose list; sections are foldable and ordered by drag.
- Sort root folders by **Name**, **Modified**, **Created**, or **Custom** from the folders header (sort applies inside each section and the unassigned list).
- Create sections from the folders header; right-click a root folder or smart folder to move it between sections, or drag it onto a section.
- On a folder’s notes list, use the depth icon next to the title to toggle **This folder** vs **All below** (include or exclude notes in subfolders).
- Sort, group, and pinned controls sit on the right of the same notes header row.
- Use **All notes** to see every note (including notes that live in the vault root).
- Sort notes by **Name**, **Modified**, or **Created** (ascending or descending) from controls in the notes pane.
- Group notes by **None**, **Modified**, or **Created** (recency buckets), with a separate **Pinned** toggle for bookmarked notes.
- Right-click a note to **Pin** or **Unpin** it (toggles a core Bookmarks file bookmark).
- Drag sibling folder rows to save a custom order across sessions (when folder sort is **Custom**, or for nested siblings).
- Create **smart folders** that look like folders but list notes matching property rules (frontmatter, tags, name, path, created, modified, pinned), including relative date filters such as today or last 7 days. Drag them among real folders, into a folder to nest, or between sections.
- Use **Reveal current note** in the folders or notes header to jump to the active note in its folder list.

## Use

Enable the plugin, then select the Alternative Explorer ribbon icon or run **Alternative Explorer: Open explorer view** from the command palette. The explorer opens in the left sidebar. Selecting a note opens it in the main editor.

Pinned notes come from Obsidian's core **Bookmarks** plugin (file bookmarks). Right-click a note in the list to pin or unpin it. If Bookmarks is disabled, pin/unpin shows a notice and the Pinned section stays empty. Use the **Pinned** control in the notes pane to show or hide the dedicated pinned group.

Smart folders are stored in plugin settings (not as vault folders). Create one from the folders header, then set one or more rules against frontmatter properties, tags, name, path, created, modified, or pinned state. For created/modified, choose relative ranges (today, yesterday, last 7/30 days, this/last week or month), a custom last-N-days count with **within**, or a custom date. Drag a smart folder among real folders to reorder it, drop it onto the middle of a folder row to nest it, or use the context menu to assign a root smart folder to a section. Right-click a smart folder to edit rules, rename, move, or delete it. **Reveal current note** opens the active note’s parent folder (or **All notes** for vault-root notes), scrolls to the row, and briefly highlights it.

## Development

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm test
npm run build
```

For watch mode, run `npm run dev`. To test in a vault, copy `main.js`, `manifest.json`, and `styles.css` into the vault's `.obsidian/plugins/alternative-explorer/` folder, then reload Obsidian.

## Install from GitHub

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Deterministic-Works/Alternative-Explorer/releases/latest).
2. Create a folder named `alternative-explorer` inside your vault's `.obsidian/plugins/` directory.
3. Copy the three files into that folder.
4. Enable **Alternative Explorer** under Settings → Community plugins.

## Current scope

The initial version intentionally does not add search or file operations.
