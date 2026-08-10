import type { FolderSection, FolderSortBy, FolderSortDir } from "./constants";
import { mergeFolderOrder, moveFolderRelative, replacePathPrefix } from "./folder-order";

export interface FolderSortOptions {
	sortBy: FolderSortBy;
	sortDir: FolderSortDir;
	customOrder?: readonly string[];
	getName: (path: string) => string;
	getTimestamp: (path: string, kind: "mtime" | "ctime") => number;
}

export function createFolderSection(name: string, folderPaths: string[] = []): FolderSection {
	return {
		id: createSectionId(),
		name: name.trim() || "Untitled",
		folderPaths: [...folderPaths],
	};
}

export function createSectionId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function assignedFolderPaths(sections: readonly FolderSection[]): Set<string> {
	const assigned = new Set<string>();
	for (const section of sections) {
		for (const path of section.folderPaths) {
			assigned.add(path);
		}
	}
	return assigned;
}

export function pruneFolderSections(
	sections: readonly FolderSection[],
	existingRootPaths: readonly string[]
): FolderSection[] {
	const existing = new Set(existingRootPaths);
	const seen = new Set<string>();
	return sections.map((section) => ({
		...section,
		folderPaths: section.folderPaths.filter((path) => {
			if (!existing.has(path) || seen.has(path)) return false;
			seen.add(path);
			return true;
		}),
	}));
}

export function partitionRootFolders(
	rootFolderPaths: readonly string[],
	sections: readonly FolderSection[]
): { unassigned: string[]; sections: FolderSection[] } {
	const pruned = pruneFolderSections(sections, rootFolderPaths);
	const assigned = assignedFolderPaths(pruned);
	const unassigned = rootFolderPaths.filter((path) => !assigned.has(path));
	return { unassigned, sections: pruned };
}

export function sortFolderPaths(
	paths: readonly string[],
	options: FolderSortOptions
): string[] {
	const { sortBy, sortDir, customOrder, getName, getTimestamp } = options;
	if (sortBy === "custom") {
		return mergeFolderOrder(customOrder, [...paths]);
	}

	const direction = sortDir === "asc" ? 1 : -1;
	return [...paths].sort((left, right) => {
		if (sortBy === "name") {
			return (
				direction *
				getName(left).localeCompare(getName(right), undefined, { sensitivity: "base" })
			);
		}

		const leftTime = getTimestamp(left, sortBy);
		const rightTime = getTimestamp(right, sortBy);
		if (leftTime !== rightTime) {
			return direction * (leftTime - rightTime);
		}
		return getName(left).localeCompare(getName(right), undefined, { sensitivity: "base" });
	});
}

export function removeFolderFromSections(
	sections: readonly FolderSection[],
	folderPath: string
): FolderSection[] {
	return sections.map((section) => ({
		...section,
		folderPaths: section.folderPaths.filter((path) => path !== folderPath),
	}));
}

export function moveFolderToSection(
	sections: readonly FolderSection[],
	folderPath: string,
	sectionId: string | null
): FolderSection[] {
	const without = removeFolderFromSections(sections, folderPath);
	if (sectionId === null) {
		return without;
	}

	return without.map((section) => {
		if (section.id !== sectionId) return section;
		if (section.folderPaths.includes(folderPath)) return section;
		return {
			...section,
			folderPaths: [...section.folderPaths, folderPath],
		};
	});
}

export function moveFolderRelativeInSection(
	sections: readonly FolderSection[],
	sectionId: string,
	folderPath: string,
	targetPath: string,
	position: "before" | "after"
): FolderSection[] {
	return sections.map((section) => {
		if (section.id !== sectionId) return section;
		return {
			...section,
			folderPaths: moveFolderRelative(section.folderPaths, folderPath, targetPath, position),
		};
	});
}

export function insertFolderInSection(
	sections: readonly FolderSection[],
	sectionId: string,
	folderPath: string,
	targetPath: string | null,
	position: "before" | "after"
): FolderSection[] {
	const without = removeFolderFromSections(sections, folderPath);
	return without.map((section) => {
		if (section.id !== sectionId) return section;
		if (!targetPath || !section.folderPaths.includes(targetPath)) {
			return {
				...section,
				folderPaths: [...section.folderPaths, folderPath],
			};
		}
		return {
			...section,
			folderPaths: moveFolderRelative(
				[...section.folderPaths, folderPath],
				folderPath,
				targetPath,
				position
			),
		};
	});
}

export function reorderSections(
	sections: readonly FolderSection[],
	sectionId: string,
	targetId: string,
	position: "before" | "after"
): FolderSection[] {
	if (sectionId === targetId) return [...sections];
	const ids = sections.map((section) => section.id);
	if (!ids.includes(sectionId) || !ids.includes(targetId)) return [...sections];

	const nextIds = moveFolderRelative(ids, sectionId, targetId, position);
	const byId = new Map(sections.map((section) => [section.id, section]));
	return nextIds
		.map((id) => byId.get(id))
		.filter((section): section is FolderSection => section !== undefined);
}

export function renameSection(
	sections: readonly FolderSection[],
	sectionId: string,
	name: string
): FolderSection[] {
	const trimmed = name.trim() || "Untitled";
	return sections.map((section) =>
		section.id === sectionId ? { ...section, name: trimmed } : section
	);
}

export function deleteSection(
	sections: readonly FolderSection[],
	sectionId: string
): FolderSection[] {
	return sections.filter((section) => section.id !== sectionId);
}

export function remapFolderSections(
	sections: readonly FolderSection[],
	oldPath: string,
	newPath: string
): FolderSection[] {
	return sections.map((section) => ({
		...section,
		folderPaths: section.folderPaths.map((path) => replacePathPrefix(path, oldPath, newPath)),
	}));
}

export function findSectionIdForFolder(
	sections: readonly FolderSection[],
	folderPath: string
): string | null {
	for (const section of sections) {
		if (section.folderPaths.includes(folderPath)) {
			return section.id;
		}
	}
	return null;
}
