import { describe, expect, it } from "vitest";
import { groupNotesByRecency } from "./note-groups";
import { collectBookmarkedFilePaths } from "./bookmarks";

const NOW = new Date(2026, 7, 9, 15, 30, 0); // Aug 9, 2026 local

function note(path: string, mtime: number) {
	return { path, mtime };
}

describe("groupNotesByRecency", () => {
	it("puts pinned notes first and excludes them from date buckets", () => {
		const today = new Date(2026, 7, 9, 10, 0, 0).getTime();
		const groups = groupNotesByRecency(
			[note("a.md", today), note("b.md", today)],
			new Set(["a.md"]),
			NOW
		);

		expect(groups.map((group) => group.id)).toEqual(["pinned", "today"]);
		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["a.md"]);
		expect(groups[1]?.notes.map((item) => item.path)).toEqual(["b.md"]);
	});

	it("buckets notes into today, yesterday, previous 7, previous 30, and months", () => {
		const today = new Date(2026, 7, 9, 8, 0, 0).getTime();
		const yesterday = new Date(2026, 7, 8, 20, 0, 0).getTime();
		const previous7 = new Date(2026, 7, 5, 12, 0, 0).getTime();
		const previous30 = new Date(2026, 6, 20, 12, 0, 0).getTime();
		const older = new Date(2026, 4, 1, 12, 0, 0).getTime();

		const groups = groupNotesByRecency(
			[
				note("today.md", today),
				note("yesterday.md", yesterday),
				note("week.md", previous7),
				note("month.md", previous30),
				note("may.md", older),
			],
			new Set(),
			NOW
		);

		expect(groups.map((group) => ({ id: group.id, label: group.label }))).toEqual([
			{ id: "today", label: "Today" },
			{ id: "yesterday", label: "Yesterday" },
			{ id: "previous-7-days", label: "Previous 7 Days" },
			{ id: "previous-30-days", label: "Previous 30 Days" },
			{ id: "month-2026-05", label: "May 2026" },
		]);
	});

	it("sorts within a section newest-first", () => {
		const newer = new Date(2026, 7, 9, 14, 0, 0).getTime();
		const older = new Date(2026, 7, 9, 9, 0, 0).getTime();
		const groups = groupNotesByRecency(
			[note("older.md", older), note("newer.md", newer)],
			new Set(),
			NOW
		);

		expect(groups[0]?.notes.map((item) => item.path)).toEqual(["newer.md", "older.md"]);
	});

	it("omits empty sections", () => {
		const older = new Date(2025, 0, 1, 12, 0, 0).getTime();
		const groups = groupNotesByRecency([note("old.md", older)], new Set(), NOW);
		expect(groups).toHaveLength(1);
		expect(groups[0]?.id).toBe("month-2025-01");
	});
});

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
