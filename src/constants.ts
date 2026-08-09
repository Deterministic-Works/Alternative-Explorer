export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export interface AlternativeExplorerSettings {
	currentFolder: string;
	recursive: boolean;
	expandedFolders: string[];
	folderOrder: Record<string, string[]>;
}

export function createDefaultSettings(rootPath: string): AlternativeExplorerSettings {
	return {
		currentFolder: rootPath,
		recursive: false,
		expandedFolders: [rootPath],
		folderOrder: Object.create(null) as Record<string, string[]>,
	};
}
