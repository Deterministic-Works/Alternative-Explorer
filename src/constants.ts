export const VIEW_TYPE_ALTERNATIVE_EXPLORER = "alternative-explorer-view";

export const SMART_FOLDER_SCOPE_PREFIX = "smart:";

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

export type SmartFolderMatch = "all" | "any";

export type SmartFolderBuiltinField = "tags" | "name" | "path" | "ctime" | "mtime";

export type SmartFolderField = SmartFolderBuiltinField | `frontmatter:${string}`;

export type SmartFolderOperator =
	| "equals"
	| "not-equals"
	| "contains"
	| "not-contains"
	| "exists"
	| "not-exists"
	| "starts-with"
	| "ends-with"
	| "before"
	| "after"
	| "on"
	| "within";

export interface SmartFolderRule {
	id: string;
	field: SmartFolderField;
	operator: SmartFolderOperator;
	value: string;
}

export interface SmartFolder {
	id: string;
	name: string;
	match: SmartFolderMatch;
	rules: SmartFolderRule[];
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
	smartFolders: SmartFolder[];
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
		smartFolders: [],
		sortBy: "mtime",
		sortDir: "desc",
		groupBy: "mtime",
		groupPinned: true,
	};
}

export function isSmartFolderScope(scope: string): boolean {
	return scope.startsWith(SMART_FOLDER_SCOPE_PREFIX);
}

export function smartFolderScopeId(scope: string): string | null {
	if (!isSmartFolderScope(scope)) return null;
	const id = scope.slice(SMART_FOLDER_SCOPE_PREFIX.length);
	return id.length > 0 ? id : null;
}

export function toSmartFolderScope(id: string): string {
	return `${SMART_FOLDER_SCOPE_PREFIX}${id}`;
}
