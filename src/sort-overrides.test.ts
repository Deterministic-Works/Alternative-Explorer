import { describe, expect, it } from "vitest";
import {
	clearSortOverride,
	hasSortOverride,
	pruneMissingOverrideKeys,
	remapSortOverrideKeys,
	resolveFolderSort,
	resolveNoteSort,
	setSortOverride,
} from "./sort-overrides";

describe("resolveFolderSort", () => {
	const defaults = { sortBy: "custom" as const, sortDir: "asc" as const };

	it("returns defaults when no override exists", () => {
		expect(resolveFolderSort(defaults, {}, "")).toEqual(defaults);
	});

	it("returns the override for the parent path", () => {
		expect(
			resolveFolderSort(
				defaults,
				{ Projects: { sortBy: "name", sortDir: "desc" } },
				"Projects"
			)
		).toEqual({ sortBy: "name", sortDir: "desc" });
	});
});

describe("resolveNoteSort", () => {
	const defaults = { sortBy: "mtime" as const, sortDir: "desc" as const };

	it("returns defaults when no override exists", () => {
		expect(resolveNoteSort(defaults, {}, "all")).toEqual(defaults);
	});

	it("returns the override for the notes scope", () => {
		expect(
			resolveNoteSort(
				defaults,
				{ "smart:abc": { sortBy: "name", sortDir: "asc" } },
				"smart:abc"
			)
		).toEqual({ sortBy: "name", sortDir: "asc" });
	});
});

describe("setSortOverride / clearSortOverride / hasSortOverride", () => {
	it("sets, detects, and clears an override without mutating the original", () => {
		const original = { Inbox: { sortBy: "ctime" as const, sortDir: "asc" as const } };
		const next = setSortOverride(original, "Projects", {
			sortBy: "name",
			sortDir: "desc",
		});
		expect(next).toEqual({
			Inbox: { sortBy: "ctime", sortDir: "asc" },
			Projects: { sortBy: "name", sortDir: "desc" },
		});
		expect(original).toEqual({ Inbox: { sortBy: "ctime", sortDir: "asc" } });
		expect(hasSortOverride(next, "Projects")).toBe(true);

		const cleared = clearSortOverride(next, "Projects");
		expect(hasSortOverride(cleared, "Projects")).toBe(false);
		expect(cleared).toEqual({ Inbox: { sortBy: "ctime", sortDir: "asc" } });
		expect(hasSortOverride(next, "Projects")).toBe(true);
	});
});

describe("remapSortOverrideKeys", () => {
	it("remaps folder path keys and nested prefixes", () => {
		expect(
			remapSortOverrideKeys(
				{
					Projects: { sortBy: "name" as const, sortDir: "asc" as const },
					"Projects/Work": { sortBy: "mtime" as const, sortDir: "desc" as const },
					Archive: { sortBy: "custom" as const, sortDir: "asc" as const },
				},
				"Projects",
				"Work"
			)
		).toEqual({
			Work: { sortBy: "name", sortDir: "asc" },
			"Work/Work": { sortBy: "mtime", sortDir: "desc" },
			Archive: { sortBy: "custom", sortDir: "asc" },
		});
	});

	it("leaves smart-scope note keys unchanged when remapping a folder path", () => {
		expect(
			remapSortOverrideKeys(
				{
					"smart:abc": { sortBy: "name" as const, sortDir: "asc" as const },
					Projects: { sortBy: "mtime" as const, sortDir: "desc" as const },
				},
				"Projects",
				"Work"
			)
		).toEqual({
			"smart:abc": { sortBy: "name", sortDir: "asc" },
			Work: { sortBy: "mtime", sortDir: "desc" },
		});
	});
});

describe("pruneMissingOverrideKeys", () => {
	it("keeps only keys accepted by the predicate", () => {
		expect(
			pruneMissingOverrideKeys(
				{
					all: { sortBy: "name" as const, sortDir: "asc" as const },
					Missing: { sortBy: "mtime" as const, sortDir: "desc" as const },
					"smart:gone": { sortBy: "ctime" as const, sortDir: "asc" as const },
				},
				(key) => key === "all"
			)
		).toEqual({
			all: { sortBy: "name", sortDir: "asc" },
		});
	});
});
