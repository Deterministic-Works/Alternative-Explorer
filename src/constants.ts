export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export type ExplorerPane = "folders" | "notes";

export interface AlternativeExplorerSettings {
	currentFolder: string;
	pane: ExplorerPane;
	notesScope: "all" | string;
	folderOrder: Record<string, string[]>;
}

export function createDefaultSettings(rootPath: string): AlternativeExplorerSettings {
	return {
		currentFolder: rootPath,
		pane: "folders",
		notesScope: "all",
		folderOrder: Object.create(null) as Record<string, string[]>,
	};
}
