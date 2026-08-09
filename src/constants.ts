export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export type ExplorerPane = "folders" | "notes";

export interface AlternativeExplorerSettings {
	currentFolder: string;
	pane: ExplorerPane;
	notesScope: "all" | string;
	recursive: boolean;
	expandedFolders: string[];
	folderOrder: Record<string, string[]>;
}

export function createDefaultSettings(rootPath: string): AlternativeExplorerSettings {
	return {
		currentFolder: rootPath,
		pane: "folders",
		notesScope: "all",
		recursive: false,
		expandedFolders: [],
		folderOrder: Object.create(null) as Record<string, string[]>,
	};
}
