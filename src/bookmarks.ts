import type { App } from "obsidian";

interface BookmarkLike {
	type?: unknown;
	path?: unknown;
	items?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function collectFilePaths(items: readonly unknown[], into: Set<string>): void {
	for (const item of items) {
		if (!isRecord(item)) continue;
		const bookmark = item as BookmarkLike;
		if (bookmark.type === "file" && typeof bookmark.path === "string" && bookmark.path.length > 0) {
			into.add(bookmark.path);
			continue;
		}
		if (bookmark.type === "group" && Array.isArray(bookmark.items)) {
			collectFilePaths(bookmark.items, into);
		}
	}
}

function readBookmarkItems(app: App): unknown[] {
	const internalPlugins = (app as App & {
		internalPlugins?: {
			getEnabledPluginById?: (id: string) => unknown;
			plugins?: Record<string, { instance?: { getBookmarks?: () => unknown } }>;
		};
	}).internalPlugins;

	if (!internalPlugins) {
		return [];
	}

	const enabled = internalPlugins.getEnabledPluginById?.("bookmarks") as
		| { getBookmarks?: () => unknown }
		| undefined;
	if (enabled && typeof enabled.getBookmarks === "function") {
		const bookmarks = enabled.getBookmarks();
		return Array.isArray(bookmarks) ? bookmarks : [];
	}

	const plugin = internalPlugins.plugins?.bookmarks;
	const instance = plugin?.instance;
	if (instance && typeof instance.getBookmarks === "function") {
		const bookmarks = instance.getBookmarks();
		return Array.isArray(bookmarks) ? bookmarks : [];
	}

	return [];
}

/** Returns bookmarked file paths from Obsidian's core Bookmarks plugin. */
export function getBookmarkedFilePaths(app: App): Set<string> {
	const paths = new Set<string>();
	try {
		collectFilePaths(readBookmarkItems(app), paths);
	} catch {
		return new Set();
	}
	return paths;
}

/** Pure helper for tests: flatten nested bookmark-like items to file paths. */
export function collectBookmarkedFilePaths(items: readonly unknown[]): Set<string> {
	const paths = new Set<string>();
	collectFilePaths(items, paths);
	return paths;
}
