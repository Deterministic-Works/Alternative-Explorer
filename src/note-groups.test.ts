import { describe, expect, it } from "vitest";
import { buildNoteGroups, compareNotes, groupNotesByRecency } from "./note-groups";

const NOW = new Date(2026, 7, 9, 15, 30, 0); // Aug 9, 2026 local

function note(path: string, mtime: number, ctime: number = mtime) {
	return {
		path,
		name: path.split("/").pop() ?? path,
		mtime,
		ctime,
	};
}

describe("compareNotes", () => {
	it("sorts by name ascending and descending", () => {
		const alpha = note("Alpha.md", 1);
		const beta = note("beta.md", 2);
		expect(compareNotes(alpha, beta, "name", "asc")).toBeLessThan(0);
		expect(compareNotes(alpha, beta, "name", "desc")).toBeGreaterThan(0);
	});

	it("sorts by mtime and ctime", () => {
		const older = note("a.md", 10, 100);
		const newer = note("b.md", 20, 50);
		expect(compareNotes(older, newer, "mtime", "asc")).toBeLessThan(0);
		expect(compareNotes(older, newer, "ctime", "asc")).toBeGreaterThan(0);
	});
});

describe("buildNoteGroups", () => {
	it("puts pinned notes first when groupPinned is true", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const groups = buildNoteGroups([note("a.md", today), note("b.md", today)], {
			sortBy: "mtime",
			sortDir: "desc",
			groupBy: "mtime",
			groupPinned: true,
			pinnedPaths: new Set(["a.md"]),
			now: NOW,
		});

		expect(groups.map((group) => group.id)).toEqual(["pinned", "today"]);
		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["a.md"]);
		expect(groups[1]?.notes.map((item) => item.path)).toEqual(["b.md"]);
	});

	it("keeps pinned notes in normal groups when groupPinned is false", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const groups = buildNoteGroups([note("a.md", today), note("b.md", today)], {
			sortBy: "name",
			sortDir: "asc",
			groupBy: "mtime",
			groupPinned: false,
			pinnedPaths: new Set(["a.md"]),
			now: NOW,
		});

		expect(groups.map((group) => group.id)).toEqual(["today"]);
		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["a.md", "b.md"]);
	});

	it("supports a flat list when groupBy is none", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const yesterday = new Date(2026, 7, 8, 10, 0, 0).getTime();
		const groups = buildNoteGroups(
			[note("b.md", today), note("a.md", yesterday)],
			{
				sortBy: "name",
				sortDir: "asc",
				groupBy: "none",
				groupPinned: false,
				pinnedPaths: new Set(),
				now: NOW,
			}
		);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.id).toBe("all");
		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["a.md", "b.md"]);
	});

	it("groups by created time when groupBy is ctime", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const lastMonth = new Date(2026, 4, 1, 12, 0, 0).getTime();
		const groups = buildNoteGroups(
			[note("new-mtime.md", today, lastMonth), note("old-mtime.md", lastMonth, today)],
			{
				sortBy: "name",
				sortDir: "asc",
				groupBy: "ctime",
				groupPinned: false,
				pinnedPaths: new Set(),
				now: NOW,
			}
		);

		expect(groups.map((group) => group.id)).toEqual(["today", "month-2026-05"]);
		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["old-mtime.md"]);
		expect(groups[1]?.notes.map((item) => item.path)).toEqual(["new-mtime.md"]);
	});

	it("buckets notes into today, yesterday, previous 7, previous 30, and months", () => {
		const today = new Date(2026, 7, 9, 8, 0, 0).getTime();
		const yesterday = new Date(2026, 7, 8, 20, 0, 0).getTime();
		const previous7 = new Date(2026, 7, 5, 12, 0, 0).getTime();
		const previous30 = new Date(2026, 6, 20, 12, 0, 0).getTime();
		const older = new Date(2026, 4, 1, 12, 0, 0).getTime();

		const groups = buildNoteGroups(
			[
				note("today.md", today),
				note("yesterday.md", yesterday),
				note("week.md", previous7),
				note("month.md", previous30),
				note("may.md", older),
			],
			{
				sortBy: "mtime",
				sortDir: "desc",
				groupBy: "mtime",
				groupPinned: true,
				pinnedPaths: new Set(),
				now: NOW,
			}
		);

		expect(groups.map((group) => ({ id: group.id, label: group.label }))).toEqual([
			{ id: "today", label: "Today" },
			{ id: "yesterday", label: "Yesterday" },
			{ id: "previous-7-days", label: "Previous 7 Days" },
			{ id: "previous-30-days", label: "Previous 30 Days" },
			{ id: "month-2026-05", label: "May 2026" },
		]);
	});

	it("sorts within a section by the selected sort", () => {
		const newer = new Date(2026, 7, 9, 14, 0, 0).getTime();
		const older = new Date(2026, 7, 9, 9, 0, 0).getTime();
		const groups = buildNoteGroups(
			[note("older.md", older), note("newer.md", newer)],
			{
				sortBy: "mtime",
				sortDir: "desc",
				groupBy: "mtime",
				groupPinned: false,
				pinnedPaths: new Set(),
				now: NOW,
			}
		);

		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["newer.md", "older.md"]);
	});
});

describe("groupNotesByRecency", () => {
	it("preserves previous default behavior", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const groups = groupNotesByRecency(
			[note("a.md", today), note("b.md", today)],
			new Set(["a.md"]),
			NOW
		);

		expect(groups.map((group) => group.id)).toEqual(["pinned", "today"]);
	});
});
