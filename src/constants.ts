export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export interface AlternativeExplorerSettings {
	currentFolder: string;
	recursive: boolean;
	folderOrder: Record<string, string[]>;
}

export function createDefaultSettings(rootPath: string): AlternativeExplorerSettings {
	return {
		currentFolder: rootPath,
		recursive: false,
		folderOrder: Object.create(null) as Record<string, string[]>,
	};
}
