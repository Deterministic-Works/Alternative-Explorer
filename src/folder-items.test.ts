import { describe, expect, it } from "vitest";
import { createSmartFolder } from "./smart-folders";
import {
	childSmartItemKeys,
	collectExpandableFolderPaths,
	effectiveSmartParentPath,
	placeItemInParentOrder,
	pruneMissingSmartParents,
	remapSmartFolderParents,
	removeItemFromAllOrders,
	removeSmartFolderPlacement,
	rootSmartItemKeys,
	setSmartFolderParent,
	toSmartItemKey,
} from "./folder-items";

describe("smart folder item keys", () => {
	it("lists root and nested smart folder keys", () => {
		const folders = [
			createSmartFolder("Root A", { id: "a" }),
			createSmartFolder("Nested", { id: "b", parentPath: "Projects" }),
			createSmartFolder("Root B", { id: "c" }),
		];
		expect(rootSmartItemKeys(folders)).toEqual(["smart:a", "smart:c"]);
		expect(childSmartItemKeys(folders, "Projects")).toEqual(["smart:b"]);
		expect(toSmartItemKey("a")).toBe("smart:a");
		expect(effectiveSmartParentPath(folders[1]!, "/")).toBe("Projects");
		expect(effectiveSmartParentPath(folders[0]!, "/")).toBe("/");
	});
});

describe("smart folder parent updates", () => {
	it("sets, remaps, and prunes parent paths", () => {
		const folders = [
			createSmartFolder("A", { id: "a", parentPath: "Projects" }),
			createSmartFolder("B", { id: "b", parentPath: "Archive" }),
		];
		expect(setSmartFolderParent(folders, "a", null)[0]?.parentPath).toBeNull();
		expect(remapSmartFolderParents(folders, "Projects", "Work")[0]?.parentPath).toBe("Work");

		const pruned = pruneMissingSmartParents(folders, (path) => path === "Projects");
		expect(pruned.changed).toBe(true);
		expect(pruned.folders.map((folder) => folder.parentPath)).toEqual(["Projects", null]);
	});
});

describe("order placement", () => {
	it("moves an item between parents and relative targets", () => {
		const initial = {
			"/": ["Inbox", "smart:a"],
			Projects: ["Notes"],
		};
		const nested = placeItemInParentOrder(initial, "smart:a", "Projects", "Notes", "before");
		expect(nested["/"]).toEqual(["Inbox"]);
		expect(nested.Projects).toEqual(["smart:a", "Notes"]);

		const rooted = placeItemInParentOrder(nested, "smart:a", "/", "Inbox", "after");
		expect(rooted["/"]).toEqual(["Inbox", "smart:a"]);
		expect(rooted.Projects).toEqual(["Notes"]);
	});

	it("removes placement when deleting a smart folder", () => {
		const folders = [
			createSmartFolder("A", { id: "a" }),
			createSmartFolder("B", { id: "b", parentPath: "Projects" }),
		];
		const result = removeSmartFolderPlacement(
			folders,
			[{ id: "s1", name: "Work", folderPaths: ["smart:a", "Inbox"] }],
			{ "/": ["smart:a"], Projects: ["smart:b", "Notes"] },
			"a"
		);
		expect(result.smartFolders.map((folder) => folder.id)).toEqual(["b"]);
		expect(result.folderSections[0]?.folderPaths).toEqual(["Inbox"]);
		expect(result.folderOrder["/"]).toEqual([]);
		expect(removeItemFromAllOrders(result.folderOrder, "smart:b").Projects).toEqual(["Notes"]);
	});
});

describe("collectExpandableFolderPaths", () => {
	it("returns only folders that have vault subfolders", () => {
		expect(
			collectExpandableFolderPaths([
				{ path: "Inbox", children: [] },
				{
					path: "Projects",
					children: [
						{ path: "Projects/App", children: [{ path: "Projects/App/Notes", children: [] }] },
						{ path: "Projects/Docs", children: [] },
					],
				},
			])
		).toEqual(["Projects", "Projects/App"]);
	});

	it("returns an empty list when nothing is nested", () => {
		expect(
			collectExpandableFolderPaths([
				{ path: "A", children: [] },
				{ path: "B", children: [] },
			])
		).toEqual([]);
	});
});
