import { describe, expect, it, vi } from "vitest";
import {
	addRootFileBookmark,
	bookmarkPathsFingerprint,
	bookmarkTreeHasFile,
	collectBookmarkedFilePaths,
	removeFileBookmarks,
	wrapBookmarksRequestSave,
	type BookmarkItem,
	type BookmarksPluginInstance,
} from "./bookmarks";

describe("collectBookmarkedFilePaths", () => {
	it("collects nested file bookmarks and ignores non-file entries", () => {
		const paths = collectBookmarkedFilePaths([
			{ type: "file", path: "Inbox/a.md" },
			{ type: "folder", path: "Projects" },
			{
				type: "group",
				items: [
					{ type: "file", path: "Pinned/b.md" },
					{ type: "search", query: "todo" },
					{
						type: "group",
						items: [{ type: "file", path: "Pinned/c.md" }],
					},
				],
			},
			{ type: "file" },
		]);

		expect(Array.from(paths).sort()).toEqual(["Inbox/a.md", "Pinned/b.md", "Pinned/c.md"]);
	});
});

describe("bookmarkPathsFingerprint", () => {
	it("is order-independent and stable for the same set", () => {
		expect(bookmarkPathsFingerprint(new Set(["b.md", "a.md"]))).toBe(
			bookmarkPathsFingerprint(new Set(["a.md", "b.md"]))
		);
		expect(bookmarkPathsFingerprint(new Set(["a.md"]))).not.toBe(
			bookmarkPathsFingerprint(new Set(["a.md", "b.md"]))
		);
	});
});

describe("wrapBookmarksRequestSave", () => {
	it("notifies on requestSave and restores the original on unsubscribe", () => {
		const original = vi.fn();
		const instance: BookmarksPluginInstance = { items: [], requestSave: original };
		const onChange = vi.fn();

		const unsubscribe = wrapBookmarksRequestSave(instance, onChange);
		instance.requestSave?.();

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(original).toHaveBeenCalledTimes(1);

		unsubscribe();
		instance.requestSave?.();
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(original).toHaveBeenCalledTimes(2);
	});

	it("removes requestSave when none existed before wrapping", () => {
		const instance: BookmarksPluginInstance = { items: [] };
		const onChange = vi.fn();
		const unsubscribe = wrapBookmarksRequestSave(instance, onChange);

		expect(typeof instance.requestSave).toBe("function");
		instance.requestSave?.();
		expect(onChange).toHaveBeenCalledTimes(1);

		unsubscribe();
		expect(instance.requestSave).toBeUndefined();
	});
});

describe("addRootFileBookmark", () => {
	it("adds a root-level file bookmark", () => {
		const items: BookmarkItem[] = [{ type: "folder", path: "Projects" }];
		expect(addRootFileBookmark(items, "Notes/a.md", 123)).toBe(true);
		expect(items).toEqual([
			{ type: "folder", path: "Projects" },
			{ type: "file", path: "Notes/a.md", ctime: 123 },
		]);
	});

	it("is idempotent when the file is already bookmarked anywhere", () => {
		const items: BookmarkItem[] = [
			{
				type: "group",
				items: [{ type: "file", path: "Notes/a.md", ctime: 1 }],
			},
		];
		expect(addRootFileBookmark(items, "Notes/a.md", 99)).toBe(false);
		expect(items).toHaveLength(1);
		expect(bookmarkTreeHasFile(items, "Notes/a.md")).toBe(true);
	});
});

describe("removeFileBookmarks", () => {
	it("removes root and nested file bookmarks for a path", () => {
		const items: BookmarkItem[] = [
			{ type: "file", path: "Notes/a.md", ctime: 1 },
			{ type: "folder", path: "Projects" },
			{
				type: "group",
				title: "Pinned",
				items: [
					{ type: "file", path: "Notes/a.md", ctime: 2 },
					{ type: "file", path: "Notes/b.md", ctime: 3 },
					{
						type: "group",
						items: [{ type: "file", path: "Notes/a.md", ctime: 4 }],
					},
				],
			},
		];

		expect(removeFileBookmarks(items, "Notes/a.md")).toBe(true);
		expect(collectBookmarkedFilePaths(items)).toEqual(new Set(["Notes/b.md"]));
		expect(items).toEqual([
			{ type: "folder", path: "Projects" },
			{
				type: "group",
				title: "Pinned",
				items: [
					{ type: "file", path: "Notes/b.md", ctime: 3 },
					{ type: "group", items: [] },
				],
			},
		]);
	});

	it("returns false and leaves non-matching entries alone", () => {
		const items: BookmarkItem[] = [
			{ type: "file", path: "Notes/b.md", ctime: 1 },
			{ type: "search", query: "todo" },
		];
		expect(removeFileBookmarks(items, "Notes/a.md")).toBe(false);
		expect(items).toEqual([
			{ type: "file", path: "Notes/b.md", ctime: 1 },
			{ type: "search", query: "todo" },
		]);
	});
});
