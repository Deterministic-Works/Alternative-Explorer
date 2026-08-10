import { describe, expect, it } from "vitest";
import type { SmartFolder } from "./constants";
import {
	createSmartFolder,
	createSmartFolderRule,
	filterNotesBySmartFolder,
	noteMatchesRule,
	noteMatchesSmartFolder,
	parseSmartFolder,
	type SmartFolderNoteSnapshot,
} from "./smart-folders";

function note(partial: Partial<SmartFolderNoteSnapshot> = {}): SmartFolderNoteSnapshot {
	return {
		path: partial.path ?? "Projects/Note.md",
		name: partial.name ?? "Note",
		ctime: partial.ctime ?? Date.parse("2026-01-10T12:00:00"),
		mtime: partial.mtime ?? Date.parse("2026-02-15T12:00:00"),
		tags: partial.tags ?? [],
		frontmatter: partial.frontmatter ?? {},
		pinned: partial.pinned ?? false,
	};
}

function folder(partial: Partial<SmartFolder> & Pick<SmartFolder, "rules">): SmartFolder {
	return createSmartFolder(partial.name ?? "Smart", {
		id: partial.id ?? "smart-1",
		match: partial.match,
		rules: partial.rules,
	});
}

describe("smart folder parsing", () => {
	it("parses a valid smart folder and drops invalid rules", () => {
		const parsed = parseSmartFolder({
			id: "abc",
			name: "  Done  ",
			match: "any",
			rules: [
				{ id: "r1", field: "frontmatter:status", operator: "equals", value: "done" },
				{ id: "bad", field: "nope", operator: "equals", value: "x" },
			],
		});
		expect(parsed).toEqual({
			id: "abc",
			name: "Done",
			match: "any",
			rules: [
				{
					id: "r1",
					field: "frontmatter:status",
					operator: "equals",
					value: "done",
				},
			],
		});
	});

	it("returns null for invalid smart folders", () => {
		expect(parseSmartFolder({ name: "Missing id" })).toBeNull();
		expect(parseSmartFolder(null)).toBeNull();
	});
});

describe("noteMatchesRule", () => {
	it("matches tags with and without hash prefixes", () => {
		const tagged = note({ tags: ["#work", "home"] });
		expect(
			noteMatchesRule(
				tagged,
				createSmartFolderRule({ field: "tags", operator: "contains", value: "work" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				tagged,
				createSmartFolderRule({ field: "tags", operator: "equals", value: "home" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				tagged,
				createSmartFolderRule({ field: "tags", operator: "equals", value: "missing" })
			)
		).toBe(false);
	});

	it("matches name and path string operators", () => {
		const entry = note({ name: "Weekly Review", path: "Journal/Weekly Review.md" });
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "name", operator: "starts-with", value: "weekly" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "path", operator: "ends-with", value: ".md" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "path", operator: "contains", value: "Journal" })
			)
		).toBe(true);
	});

	it("matches frontmatter scalars and arrays", () => {
		const entry = note({
			frontmatter: {
				status: "done",
				topics: ["alpha", "beta"],
				draft: true,
			},
		});
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({
					field: "frontmatter:status",
					operator: "equals",
					value: "done",
				})
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({
					field: "frontmatter:topics",
					operator: "equals",
					value: "beta",
				})
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({
					field: "frontmatter:draft",
					operator: "equals",
					value: "true",
				})
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({
					field: "frontmatter:missing",
					operator: "exists",
					value: "",
				})
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({
					field: "frontmatter:missing",
					operator: "not-exists",
					value: "",
				})
			)
		).toBe(true);
	});

	it("matches date operators against local calendar days", () => {
		const entry = note({
			ctime: Date.parse("2026-01-10T18:30:00"),
			mtime: Date.parse("2026-02-15T09:00:00"),
		});
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "ctime", operator: "on", value: "2026-01-10" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "mtime", operator: "before", value: "2026-02-15" })
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "mtime", operator: "after", value: "2026-02-14" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				entry,
				createSmartFolderRule({ field: "mtime", operator: "equals", value: "x" })
			)
		).toBe(false);
	});

	it("matches relative date filters", () => {
		const now = new Date(2026, 2, 11, 15, 0, 0); // Wednesday Mar 11, 2026
		const todayNote = note({ mtime: new Date(2026, 2, 11, 9, 0, 0).getTime() });
		const yesterdayNote = note({ mtime: new Date(2026, 2, 10, 9, 0, 0).getTime() });
		const sixDaysAgo = note({ mtime: new Date(2026, 2, 5, 9, 0, 0).getTime() });
		const eightDaysAgo = note({ mtime: new Date(2026, 2, 3, 9, 0, 0).getTime() });
		const lastMonthNote = note({ mtime: new Date(2026, 1, 20, 9, 0, 0).getTime() });

		expect(
			noteMatchesRule(
				todayNote,
				createSmartFolderRule({ field: "mtime", operator: "on", value: "today" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				yesterdayNote,
				createSmartFolderRule({ field: "mtime", operator: "on", value: "yesterday" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				todayNote,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-7-days" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				sixDaysAgo,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-7-days" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				eightDaysAgo,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-7-days" }),
				now
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				todayNote,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "this-week" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				lastMonthNote,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-month" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				todayNote,
				createSmartFolderRule({ field: "mtime", operator: "before", value: "today" }),
				now
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				yesterdayNote,
				createSmartFolderRule({ field: "mtime", operator: "before", value: "today" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				eightDaysAgo,
				createSmartFolderRule({ field: "mtime", operator: "on", value: "8-days-ago" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				eightDaysAgo,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-14-days" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				eightDaysAgo,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "14" }),
				now
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				lastMonthNote,
				createSmartFolderRule({ field: "mtime", operator: "within", value: "last-14-days" }),
				now
			)
		).toBe(false);
	});

	it("matches pinned and not pinned notes", () => {
		const pinnedNote = note({ path: "pinned.md", pinned: true });
		const plainNote = note({ path: "plain.md", pinned: false });

		expect(
			noteMatchesRule(
				pinnedNote,
				createSmartFolderRule({ field: "pinned", operator: "equals", value: "true" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				plainNote,
				createSmartFolderRule({ field: "pinned", operator: "equals", value: "true" })
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				plainNote,
				createSmartFolderRule({ field: "pinned", operator: "equals", value: "false" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				pinnedNote,
				createSmartFolderRule({ field: "pinned", operator: "not-equals", value: "true" })
			)
		).toBe(false);
		expect(
			noteMatchesRule(
				pinnedNote,
				createSmartFolderRule({ field: "pinned", operator: "equals", value: "yes" })
			)
		).toBe(true);
		expect(
			noteMatchesRule(
				plainNote,
				createSmartFolderRule({ field: "pinned", operator: "equals", value: "unpinned" })
			)
		).toBe(true);
	});
});

describe("noteMatchesSmartFolder", () => {
	it("returns false when there are no rules", () => {
		expect(noteMatchesSmartFolder(note(), folder({ rules: [] }))).toBe(false);
	});

	it("supports AND and OR matching", () => {
		const entry = note({
			tags: ["work"],
			frontmatter: { status: "open" },
		});
		const rules = [
			createSmartFolderRule({
				id: "r1",
				field: "tags",
				operator: "contains",
				value: "work",
			}),
			createSmartFolderRule({
				id: "r2",
				field: "frontmatter:status",
				operator: "equals",
				value: "done",
			}),
		];
		expect(noteMatchesSmartFolder(entry, folder({ match: "all", rules }))).toBe(false);
		expect(noteMatchesSmartFolder(entry, folder({ match: "any", rules }))).toBe(true);
	});

	it("filters note lists", () => {
		const notes = [
			note({ path: "a.md", name: "Alpha", tags: ["work"] }),
			note({ path: "b.md", name: "Beta", tags: ["home"] }),
		];
		const smart = folder({
			rules: [
				createSmartFolderRule({ field: "tags", operator: "contains", value: "work" }),
			],
		});
		expect(filterNotesBySmartFolder(notes, smart).map((entry) => entry.path)).toEqual([
			"a.md",
		]);
	});
});
