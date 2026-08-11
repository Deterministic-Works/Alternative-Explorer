import type {
	FolderSortBy,
	FolderSortDir,
	NoteSortBy,
	NoteSortDir,
} from "./constants";
import { replacePathPrefix } from "./folder-order";

export interface SortRule<TBy extends string, TDir extends string> {
	sortBy: TBy;
	sortDir: TDir;
}

export type FolderSortRule = SortRule<FolderSortBy, FolderSortDir>;
export type NoteSortRule = SortRule<NoteSortBy, NoteSortDir>;

export function resolveSortRule<TBy extends string, TDir extends string>(
	defaults: SortRule<TBy, TDir>,
	overrides: Readonly<Record<string, SortRule<TBy, TDir>>>,
	key: string
): SortRule<TBy, TDir> {
	const override = overrides[key];
	if (!override) return { ...defaults };
	return { sortBy: override.sortBy, sortDir: override.sortDir };
}

export function resolveFolderSort(
	defaults: FolderSortRule,
	overrides: Readonly<Record<string, FolderSortRule>>,
	parentPath: string
): FolderSortRule {
	return resolveSortRule(defaults, overrides, parentPath);
}

export function resolveNoteSort(
	defaults: NoteSortRule,
	overrides: Readonly<Record<string, NoteSortRule>>,
	notesScope: string
): NoteSortRule {
	return resolveSortRule(defaults, overrides, notesScope);
}

export function setSortOverride<TBy extends string, TDir extends string>(
	overrides: Record<string, SortRule<TBy, TDir>>,
	key: string,
	rule: SortRule<TBy, TDir>
): Record<string, SortRule<TBy, TDir>> {
	return {
		...overrides,
		[key]: { sortBy: rule.sortBy, sortDir: rule.sortDir },
	};
}

export function clearSortOverride<TBy extends string, TDir extends string>(
	overrides: Record<string, SortRule<TBy, TDir>>,
	key: string
): Record<string, SortRule<TBy, TDir>> {
	if (!(key in overrides)) return overrides;
	const next = { ...overrides };
	delete next[key];
	return next;
}

export function hasSortOverride(
	overrides: Readonly<Record<string, unknown>>,
	key: string
): boolean {
	return Object.prototype.hasOwnProperty.call(overrides, key);
}

export function remapSortOverrideKeys<TRule>(
	overrides: Readonly<Record<string, TRule>>,
	oldPath: string,
	newPath: string
): Record<string, TRule> {
	const remapped = Object.create(null) as Record<string, TRule>;
	for (const [key, rule] of Object.entries(overrides)) {
		remapped[replacePathPrefix(key, oldPath, newPath)] = rule;
	}
	return remapped;
}

export function pruneMissingOverrideKeys<TRule>(
	overrides: Readonly<Record<string, TRule>>,
	keepKey: (key: string) => boolean
): Record<string, TRule> {
	const pruned = Object.create(null) as Record<string, TRule>;
	for (const [key, rule] of Object.entries(overrides)) {
		if (keepKey(key)) {
			pruned[key] = rule;
		}
	}
	return pruned;
}
