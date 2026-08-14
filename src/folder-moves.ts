import { joinVaultPath } from "./create-paths";

/** True when destParentPath is the source folder or a descendant of it. */
export function isInvalidMoveParent(sourcePath: string, destParentPath: string): boolean {
	if (sourcePath === destParentPath) return true;
	const prefix = sourcePath.endsWith("/") ? sourcePath : `${sourcePath}/`;
	return destParentPath.startsWith(prefix);
}

/** Full vault path for a folder named `folderName` under `destParentPath`. */
export function destinationFolderPath(destParentPath: string, folderName: string): string {
	return joinVaultPath(destParentPath, folderName);
}

export type VaultFolderDropResult =
	| {
			/** Same-parent custom reorder or root section membership change. */
			kind: "display";
			position: "before" | "after";
			targetPath: string | null;
	  }
	| {
			kind: "vault-move";
			destParentPath: string;
			/** Relative target key inside destParent when before/after a sibling; null for into or zone. */
			relativeTargetKey: string | null;
			position: "before" | "after" | "into";
			/** Section to assign when the folder lands at the vault root; null means unassigned or nested. */
			rootSectionId: string | null;
	  };

type ResolveVaultFolderDropInput = {
	sourcePath: string;
	sourceParentPath: string;
	/** Vault root path (often "/"). */
	rootPath: string;
	position: "before" | "after" | "into";
	dropKind: "folder" | "zone";
	/** Target folder path when dropKind is folder. */
	targetPath?: string;
	/** Parent of the target row when dropKind is folder. */
	targetParentPath?: string;
	/** Whether the target row allows an into drop (vault folder, not smart). */
	allowsInto?: boolean;
	sectionId: string;
	/** Section currently owning the dragged root folder; unassigned id when none. */
	sourceSectionId: string;
	/** True when same-parent custom sort reorder is allowed. */
	sameParentCustomSort: boolean;
	/** Section id used for "unassigned" (empty string in the view). */
	unassignedSectionId: string;
};

/**
 * Resolve whether a vault-folder drop should reorder display order or move
 * the folder in the vault.
 */
export function resolveVaultFolderDrop(
	input: ResolveVaultFolderDropInput
): VaultFolderDropResult | null {
	const {
		sourcePath,
		sourceParentPath,
		rootPath,
		position,
		dropKind,
		targetPath,
		targetParentPath,
		allowsInto,
		sectionId,
		sourceSectionId,
		sameParentCustomSort,
		unassignedSectionId,
	} = input;

	if (dropKind === "zone" || (dropKind === "folder" && !targetPath)) {
		if (position === "into") return null;
		const resolvedPosition = position === "before" ? "before" : "after";
		if (sourceParentPath === rootPath) {
			return {
				kind: "display",
				position: resolvedPosition,
				targetPath: targetPath ?? null,
			};
		}
		return {
			kind: "vault-move",
			destParentPath: rootPath,
			relativeTargetKey: null,
			position: resolvedPosition,
			rootSectionId: sectionId === unassignedSectionId ? null : sectionId,
		};
	}

	if (!targetPath) return null;

	if (position === "into") {
		if (!allowsInto) return null;
		if (isInvalidMoveParent(sourcePath, targetPath)) return null;
		if (sourceParentPath === targetPath) return null;
		return {
			kind: "vault-move",
			destParentPath: targetPath,
			relativeTargetKey: null,
			position: "into",
			rootSectionId: null,
		};
	}

	const destParent = targetParentPath ?? rootPath;
	if (sourceParentPath === destParent) {
		if (sameParentCustomSort) {
			return {
				kind: "display",
				position,
				targetPath,
			};
		}
		// Without custom sort, same-parent before/after is only useful to change
		// root section membership by dropping onto a folder in another section.
		if (sourceParentPath === rootPath && sectionId !== sourceSectionId) {
			return {
				kind: "display",
				position,
				targetPath,
			};
		}
		return null;
	}

	if (isInvalidMoveParent(sourcePath, destParent)) return null;

	return {
		kind: "vault-move",
		destParentPath: destParent,
		relativeTargetKey: targetPath,
		position,
		rootSectionId:
			destParent === rootPath
				? sectionId === unassignedSectionId
					? null
					: sectionId
				: null,
	};
}
