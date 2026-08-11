import { describe, expect, it } from "vitest";
import {
	createFolderSection,
	deleteSection,
	findSectionIdForFolder,
	insertFolderInSection,
	moveFolderToSection,
	partitionRootFolders,
	pruneFolderSections,
	remapFolderSections,
	removeFolderFromSections,
	reorderSections,
	sortFolderPaths,
} from "./folder-sections";

describe("partitionRootFolders", () => {
	it("keeps unassigned folders out of sections and drops missing membership", () => {
		const sections = [
			{ id: "a", name: "Work", folderPaths: ["Projects", "Gone"] },
			{ id: "b", name: "Life", folderPaths: ["Journal"] },
		];
		const result = partitionRootFolders(
			["Projects", "Inbox", "Journal", "Archive"],
			sections
		);
		expect(result.unassigned).toEqual(["Inbox", "Archive"]);
		expect(result.sections[0]?.folderPaths).toEqual(["Projects"]);
		expect(result.sections[1]?.folderPaths).toEqual(["Journal"]);
	});

	it("filters missing paths for display without mutating the saved sections input", () => {
		const sections = [
			{ id: "a", name: "Work", folderPaths: ["Projects", "Gone"] },
			{ id: "b", name: "Life", folderPaths: ["Journal"] },
		];
		const original = structuredClone(sections);
		partitionRootFolders(["Projects", "Journal"], sections);
		expect(sections).toEqual(original);
	});
});

describe("removeFolderFromSections", () => {
	it("removes only the deleted path from section membership", () => {
		const sections = [
			{ id: "a", name: "Work", folderPaths: ["Projects", "Inbox"] },
			{ id: "b", name: "Life", folderPaths: ["Journal", "Projects"] },
		];
		const next = removeFolderFromSections(sections, "Projects");
		expect(next[0]?.folderPaths).toEqual(["Inbox"]);
		expect(next[1]?.folderPaths).toEqual(["Journal"]);
		expect(sections[0]?.folderPaths).toEqual(["Projects", "Inbox"]);
	});
});

describe("pruneFolderSections", () => {
	it("dedupes a folder claimed by multiple sections", () => {
		const pruned = pruneFolderSections(
			[
				{ id: "a", name: "One", folderPaths: ["Shared", "OnlyA"] },
				{ id: "b", name: "Two", folderPaths: ["Shared", "OnlyB"] },
			],
			["Shared", "OnlyA", "OnlyB"]
		);
		expect(pruned[0]?.folderPaths).toEqual(["Shared", "OnlyA"]);
		expect(pruned[1]?.folderPaths).toEqual(["OnlyB"]);
	});
});

describe("sortFolderPaths", () => {
	const names: Record<string, string> = {
		a: "Alpha",
		b: "Beta",
		c: "Charlie",
	};
	const times: Record<string, { mtime: number; ctime: number }> = {
		a: { mtime: 30, ctime: 10 },
		b: { mtime: 10, ctime: 30 },
		c: { mtime: 20, ctime: 20 },
	};
	const getName = (path: string): string => names[path] ?? path;
	const getTimestamp = (path: string, kind: "mtime" | "ctime"): number =>
		times[path]?.[kind] ?? 0;

	it("sorts by custom order and appends unknowns", () => {
		expect(
			sortFolderPaths(["c", "a", "b"], {
				sortBy: "custom",
				sortDir: "asc",
				customOrder: ["b", "a"],
				getName,
				getTimestamp,
			})
		).toEqual(["b", "a", "c"]);
	});

	it("sorts by name ascending and descending", () => {
		expect(
			sortFolderPaths(["c", "a", "b"], {
				sortBy: "name",
				sortDir: "asc",
				getName,
				getTimestamp,
			})
		).toEqual(["a", "b", "c"]);
		expect(
			sortFolderPaths(["c", "a", "b"], {
				sortBy: "name",
				sortDir: "desc",
				getName,
				getTimestamp,
			})
		).toEqual(["c", "b", "a"]);
	});

	it("sorts by modified time", () => {
		expect(
			sortFolderPaths(["a", "b", "c"], {
				sortBy: "mtime",
				sortDir: "desc",
				getName,
				getTimestamp,
			})
		).toEqual(["a", "c", "b"]);
	});
});

describe("section membership moves", () => {
	it("moves a folder into a section and out to unassigned", () => {
		const work = createFolderSection("Work", ["Projects"]);
		const life = createFolderSection("Life", []);
		const base = [work, life];
		const intoLife = moveFolderToSection(base, "Projects", life.id);
		expect(findSectionIdForFolder(intoLife, "Projects")).toBe(life.id);
		expect(intoLife[0]?.folderPaths).toEqual([]);

		const unassigned = moveFolderToSection(intoLife, "Projects", null);
		expect(findSectionIdForFolder(unassigned, "Projects")).toBeNull();
	});

	it("inserts relative to a target inside a section", () => {
		const section = createFolderSection("Work", ["a", "b", "c"]);
		const next = insertFolderInSection([section], section.id, "d", "b", "before");
		expect(next[0]?.folderPaths).toEqual(["a", "d", "b", "c"]);
	});
});

describe("reorderSections", () => {
	it("reorders sections before or after a target", () => {
		const sections = [
			{ id: "a", name: "A", folderPaths: [] },
			{ id: "b", name: "B", folderPaths: [] },
			{ id: "c", name: "C", folderPaths: [] },
		];
		expect(reorderSections(sections, "c", "a", "before").map((s) => s.id)).toEqual([
			"c",
			"a",
			"b",
		]);
		expect(reorderSections(sections, "a", "c", "after").map((s) => s.id)).toEqual([
			"b",
			"c",
			"a",
		]);
	});
});

describe("delete and remap", () => {
	it("deletes a section without touching others", () => {
		const sections = [
			{ id: "a", name: "A", folderPaths: ["x"] },
			{ id: "b", name: "B", folderPaths: ["y"] },
		];
		expect(deleteSection(sections, "a")).toEqual([
			{ id: "b", name: "B", folderPaths: ["y"] },
		]);
	});

	it("remaps folder paths inside sections", () => {
		const sections = [{ id: "a", name: "A", folderPaths: ["Projects", "Inbox"] }];
		expect(remapFolderSections(sections, "Projects", "Work")[0]?.folderPaths).toEqual([
			"Work",
			"Inbox",
		]);
	});
});
