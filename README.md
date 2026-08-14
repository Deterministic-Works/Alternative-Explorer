# Alternative Explorer

Alternative Explorer is a focused, Apple Notes–style sidebar for browsing folders and files in Obsidian. It adds a compact alternative to the built-in File Explorer without replacing it or changing your vault structure.

![Alternative Explorer showing a smart folder with pinned and date-grouped files](assets/alternative-explorer-demo.png)

## Features

### Browse your vault

- Move between an expandable folder tree and the selected folder's files in one left-sidebar view.
- See immediate subfolders above a folder's files, or include every file below that folder.
- Open **All notes** for a vault-wide list and use **Reveal current note** to return to the active file.
- Expand or fold the complete folder tree and its sections in one action.

### Organize the sidebar

- Group root folders into named, collapsible sections that exist only in Alternative Explorer.
- Drag sections, folders, and smart folders into a custom display order without moving vault folders.
- Create smart folders from rules for properties, tags, names, paths, creation or modification dates, and pinned status.
- Nest smart folders alongside real folders and match either all or any of their rules.

![Smart folder rule editor filtering notes by a property](assets/alternative-explorer-smart-folder.png)

### Sort and group files

- Choose default folder and file sorting in **Settings → Alternative Explorer**.
- Override sorting for an individual folder, smart folder, or **All notes**, then return it to the default at any time.
- Sort by name, modified time, or created time in either direction.
- Group files by modified or created date, with an optional group for pinned files.

### Navigate and create

- Use **Up** and **Down** to move through files, and **Enter** to open the selection.
- Create a note or folder at the vault root or inside the folder you are viewing.
- Pin and unpin files through Obsidian's core Bookmarks plugin.
- Open file types supported by Obsidian or another installed plugin; confirm unsupported files with a second click or **Enter** to open them in the system default application.

## Install and open

1. In Obsidian, open **Settings → Community plugins**.
2. Search for **Alternative Explorer**, select **Install**, and then select **Enable**.
3. Select the Alternative Explorer ribbon icon or run **Alternative Explorer: Open explorer view** from the command palette.

## Good to know

- Sections, smart folders, display ordering, and sorting preferences are stored in plugin settings. They do not rename, move, or create vault folders unless you explicitly use **New folder**.
- Pinning uses Obsidian's core Bookmarks plugin. If Bookmarks is disabled, pinned groups are empty and pinning is unavailable.
- Smart folders are saved searches over file metadata; they do not create folders in the vault.
- Alternative Explorer creates notes and folders but does not search note contents or move, rename, or delete existing vault files.
- The minimum supported Obsidian version is 1.7.2.

## Acknowledgements

Alternative Explorer was inspired by Apple Notes and [Notebook Navigator](https://notebooknavigator.com) ([GitHub](https://github.com/johansan/notebook-navigator)).

## Support

For bugs or feature requests, [open an issue](https://github.com/sunwookwak-polisci/Alternative-Explorer/issues). Please use synthetic examples rather than private vault content.

Alternative Explorer is released under the [MIT License](LICENSE).
