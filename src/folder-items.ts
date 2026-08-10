import {
	SmartFolder,
	FolderSection,
	isSmartFolderScope,
	smartFolderScopeId,
	toSmartFolderScope,
} from "./constants";
import { replacePathPrefix } from "./folder-order";
import { removeFolderFromSections } from "./folder-sections";

/** Vault path or `smart:<id>` key used in folderOrder / section membership. */
export type FolderItemKey = string;

export function isSmartItemKey(key: string): boolean {
	return isSmartFolderScope(key);
}

export function toSmartItemKey(id: string): string {
	return toSmartFolderScope(id);
}

export function smartIdFromItemKey(key: string): string | null {
	return smartFolderScopeId(key);
}

export function rootSmartItemKeys(smartFolders: readonly SmartFolder[]): string[] {
	return smartFolders
		.filter((folder) => folder.parentPath === null)
		.map((folder) => toSmartItemKey(folder.id));
}

export function childSmartItemKeys(
	smartFolders: readonly SmartFolder[],
	parentPath: string
): string[] {
	return smartFolders
		.filter((folder) => folder.parentPath === parentPath)
		.map((folder) => toSmartItemKey(folder.id));
}

export function effectiveSmartParentPath(
	folder: SmartFolder,
	rootPath: string
): string {
	return folder.parentPath ?? rootPath;
}

export function setSmartFolderParent(
	smartFolders: readonly SmartFolder[],
	id: string,
	parentPath: string | null
): SmartFolder[] {
	return smartFolders.map((folder) =>
		folder.id === id ? { ...folder, parentPath } : folder
	);
}

export function remapSmartFolderParents(
	smartFolders: readonly SmartFolder[],
	oldPath: string,
	newPath: string
): SmartFolder[] {
	return smartFolders.map((folder) => {
		if (folder.parentPath === null) return folder;
		return {
			...folder,
			parentPath: replacePathPrefix(folder.parentPath, oldPath, newPath),
		};
	});
}

export function pruneMissingSmartParents(
	smartFolders: readonly SmartFolder[],
	parentExists: (path: string) => boolean
): { folders: SmartFolder[]; changed: boolean } {
	let changed = false;
	const folders = smartFolders.map((folder) => {
		if (folder.parentPath === null) return folder;
		if (parentExists(folder.parentPath)) return folder;
		changed = true;
		return { ...folder, parentPath: null };
	});
	return { folders, changed };
}

export function removeItemFromAllOrders(
	folderOrder: Record<string, string[]>,
	itemKey: string
): Record<string, string[]> {
	const next = Object.create(null) as Record<string, string[]>;
	for (const [parentPath, childPaths] of Object.entries(folderOrder)) {
		next[parentPath] = childPaths.filter((path) => path !== itemKey);
	}
	return next;
}

export function placeItemInParentOrder(
	folderOrder: Record<string, string[]>,
	itemKey: string,
	parentPath: string,
	targetKey: string | null,
	position: "before" | "after"
): Record<string, string[]> {
	const cleaned = removeItemFromAllOrders(folderOrder, itemKey);
	const current = cleaned[parentPath] ?? [];
	const withItem = current.includes(itemKey) ? [...current] : [...current, itemKey];

	if (!targetKey || targetKey === itemKey || !withItem.includes(targetKey)) {
		cleaned[parentPath] = withItem;
		return cleaned;
	}

	const without = withItem.filter((key) => key !== itemKey);
	const targetIndex = without.indexOf(targetKey);
	without.splice(position === "before" ? targetIndex : targetIndex + 1, 0, itemKey);
	cleaned[parentPath] = without;
	return cleaned;
}

export function removeSmartFolderPlacement(
	smartFolders: readonly SmartFolder[],
	folderSections: readonly FolderSection[],
	folderOrder: Record<string, string[]>,
	id: string
): {
	smartFolders: SmartFolder[];
	folderSections: FolderSection[];
	folderOrder: Record<string, string[]>;
} {
	const key = toSmartItemKey(id);
	return {
		smartFolders: smartFolders.filter((folder) => folder.id !== id),
		folderSections: removeFolderFromSections(folderSections, key),
		folderOrder: removeItemFromAllOrders(folderOrder, key),
	};
}
