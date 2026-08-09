# Alternative Explorer

Alternative Explorer is an Obsidian plugin for browsing a vault in an Apple Notes–style left sidebar. One pane switches between a folder list and a dated notes list. It coexists with Obsidian's built-in file explorer.

## Features

- Open in the left sidebar from the ribbon or **Alternative Explorer: Open explorer view**.
- Browse an expandable folder tree; chevron expands nested folders inline, and tapping a folder opens its notes.
- On a folder’s notes list, toggle **This folder** vs **All below** to include or exclude notes in subfolders.
- Use **All notes** to see every note (including notes that live in the vault root).
- Sort notes by **Name**, **Modified**, or **Created** (ascending or descending) from controls in the notes pane.
- Group notes by **None**, **Modified**, or **Created** (recency buckets), with a separate **Pinned** toggle for bookmarked notes.
- Right-click a note to **Pin** or **Unpin** it (toggles a core Bookmarks file bookmark).
- Drag sibling folder rows to save a custom order across sessions.

## Use

Enable the plugin, then select the Alternative Explorer ribbon icon or run **Alternative Explorer: Open explorer view** from the command palette. The explorer opens in the left sidebar. Selecting a note opens it in the main editor.

Pinned notes come from Obsidian's core **Bookmarks** plugin (file bookmarks). Right-click a note in the list to pin or unpin it. If Bookmarks is disabled, pin/unpin shows a notice and the Pinned section stays empty. Use the **Pinned** control in the notes pane to show or hide the dedicated pinned group.

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
