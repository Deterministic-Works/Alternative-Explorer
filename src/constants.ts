export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export type ExplorerPane = "folders" | "notes";

export type NoteSortBy = "name" | "mtime" | "ctime";
export type NoteSortDir = "asc" | "desc";
export type NoteGroupBy = "none" | "mtime" | "ctime";

export interface AlternativeExplorerSettings {
	currentFolder: string;
	pane: ExplorerPane;
	notesScope: "all" | string;
	recursive: boolean;
	expandedFolders: string[];
	folderOrder: Record<string, string[]>;
	sortBy: NoteSortBy;
	sortDir: NoteSortDir;
	groupBy: NoteGroupBy;
	groupPinned: boolean;
}

export function createDefaultSettings(rootPath: string): AlternativeExplorerSettings {
	return {
		currentFolder: rootPath,
		pane: "folders",
		notesScope: "all",
		recursive: false,
		expandedFolders: [],
		folderOrder: Object.create(null) as Record<string, string[]>,
		sortBy: "mtime",
		sortDir: "desc",
		groupBy: "mtime",
		groupPinned: true,
	};
}
