export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export type ExplorerPane = "folders" | "notes";

export type NoteSortBy = "name" | "mtime" | "ctime";
export type NoteSortDir = "asc" | "desc";
export type NoteGroupBy = "none" | "mtime" | "ctime";

export type FolderSortBy = "name" | "mtime" | "ctime" | "custom";
export type FolderSortDir = "asc" | "desc";

export interface FolderSection {
	id: string;
	name: string;
	folderPaths: string[];
}

export interface AlternativeExplorerSettings {
	currentFolder: string;
	pane: ExplorerPane;
	notesScope: "all" | string;
	recursive: boolean;
	expandedFolders: string[];
	folderOrder: Record<string, string[]>;
	folderSections: FolderSection[];
	collapsedSectionIds: string[];
	folderSortBy: FolderSortBy;
	folderSortDir: FolderSortDir;
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
		folderSections: [],
		collapsedSectionIds: [],
		folderSortBy: "custom",
		folderSortDir: "asc",
		sortBy: "mtime",
		sortDir: "desc",
		groupBy: "mtime",
		groupPinned: true,
	};
}
