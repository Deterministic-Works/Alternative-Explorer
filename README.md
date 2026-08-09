# Alternative Explorer

Alternative Explorer is an Obsidian plugin for browsing a vault with folders as destinations and files as readable cards. It coexists with Obsidian's built-in file explorer.

## Features

- Click a folder to drill into it, with breadcrumbs for navigating back up.
- Expand a folder in the tree to reveal subfolders only. Files never appear in the tree.
- Switch the content pane between direct-child and recursive file listings.
- View each file as a card with its title and last-modified date.
- Drag sibling folders, or use their up/down controls, to save a custom order across sessions.

## Use

Enable the plugin, then select the folder-tree ribbon icon or run **Alternative Explorer: Open explorer view** from the command palette. The explorer opens in its own workspace tab. Selecting a file card opens that file in a new tab so the explorer remains available.

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

The initial version intentionally does not add search, file sorting/filter controls, or file operations.
