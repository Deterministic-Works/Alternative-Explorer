import type { NoteGroupBy, NoteSortBy, NoteSortDir } from "./constants";

export interface NoteLike {
	path: string;
	name: string;
	mtime: number;
	ctime: number;
}

export interface NoteGroup<T extends NoteLike = NoteLike> {
	id: string;
	label: string;
	notes: T[];
}

export interface BuildNoteGroupsOptions {
	sortBy: NoteSortBy;
	sortDir: NoteSortDir;
	groupBy: NoteGroupBy;
	groupPinned: boolean;
	pinnedPaths: ReadonlySet<string>;
	now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

function monthLabel(date: Date): string {
	return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function timestampFor(note: NoteLike, field: "mtime" | "ctime"): number {
	return field === "ctime" ? note.ctime : note.mtime;
}

export function compareNotes(
	left: NoteLike,
	right: NoteLike,
	sortBy: NoteSortBy,
	sortDir: NoteSortDir
): number {
	const direction = sortDir === "asc" ? 1 : -1;
	let result = 0;

	if (sortBy === "name") {
		result = left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
	} else {
		result = timestampFor(left, sortBy) - timestampFor(right, sortBy);
	}

	if (result === 0) {
		result = left.path.localeCompare(right.path, undefined, { sensitivity: "base" });
		return result;
	}

	return result * direction;
}

function sortNotes<T extends NoteLike>(
	notes: T[],
	sortBy: NoteSortBy,
	sortDir: NoteSortDir
): T[] {
	return [...notes].sort((left, right) => compareNotes(left, right, sortBy, sortDir));
}

function partitionPinned<T extends NoteLike>(
	notes: readonly T[],
	pinnedPaths: ReadonlySet<string>,
	groupPinned: boolean
): { pinned: T[]; rest: T[] } {
	if (!groupPinned) {
		return { pinned: [], rest: [...notes] };
	}

	const pinned: T[] = [];
	const rest: T[] = [];
	for (const note of notes) {
		if (pinnedPaths.has(note.path)) {
			pinned.push(note);
		} else {
			rest.push(note);
		}
	}
	return { pinned, rest };
}

function groupByRecency<T extends NoteLike>(
	notes: readonly T[],
	field: "mtime" | "ctime",
	now: Date
): NoteGroup<T>[] {
	const todayStart = startOfLocalDay(now);
	const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
	const previous7Start = new Date(todayStart.getTime() - 7 * DAY_MS);
	const previous30Start = new Date(todayStart.getTime() - 30 * DAY_MS);

	const today: T[] = [];
	const yesterday: T[] = [];
	const previous7: T[] = [];
	const previous30: T[] = [];
	const months = new Map<string, { label: string; notes: T[] }>();

	for (const note of notes) {
		const stamped = new Date(timestampFor(note, field));
		if (stamped >= todayStart) {
			today.push(note);
			continue;
		}
		if (stamped >= yesterdayStart) {
			yesterday.push(note);
			continue;
		}
		if (stamped >= previous7Start) {
			previous7.push(note);
			continue;
		}
		if (stamped >= previous30Start) {
			previous30.push(note);
			continue;
		}

		const key = monthKey(stamped);
		const existing = months.get(key);
		if (existing) {
			existing.notes.push(note);
		} else {
			months.set(key, { label: monthLabel(stamped), notes: [note] });
		}
	}

	const groups: NoteGroup<T>[] = [];
	if (today.length > 0) {
		groups.push({ id: "today", label: "Today", notes: today });
	}
	if (yesterday.length > 0) {
		groups.push({ id: "yesterday", label: "Yesterday", notes: yesterday });
	}
	if (previous7.length > 0) {
		groups.push({ id: "previous-7-days", label: "Previous 7 Days", notes: previous7 });
	}
	if (previous30.length > 0) {
		groups.push({ id: "previous-30-days", label: "Previous 30 Days", notes: previous30 });
	}

	const monthKeys = Array.from(months.keys()).sort((left, right) => right.localeCompare(left));
	for (const key of monthKeys) {
		const month = months.get(key);
		if (!month) continue;
		groups.push({ id: `month-${key}`, label: month.label, notes: month.notes });
	}

	return groups;
}

/**
 * Builds note sections from sort, group-by, and optional pinned partitioning.
 */
export function buildNoteGroups<T extends NoteLike>(
	notes: readonly T[],
	options: BuildNoteGroupsOptions
): NoteGroup<T>[] {
	const now = options.now ?? new Date();
	const { pinned, rest } = partitionPinned(notes, options.pinnedPaths, options.groupPinned);
	const groups: NoteGroup<T>[] = [];

	if (pinned.length > 0) {
		groups.push({
			id: "pinned",
			label: "Pinned",
			notes: sortNotes(pinned, options.sortBy, options.sortDir),
		});
	}

	if (options.groupBy === "none") {
		if (rest.length > 0) {
			groups.push({
				id: "all",
				label: "Notes",
				notes: sortNotes(rest, options.sortBy, options.sortDir),
			});
		}
		return groups;
	}

	for (const group of groupByRecency(rest, options.groupBy, now)) {
		groups.push({
			...group,
			notes: sortNotes(group.notes, options.sortBy, options.sortDir),
		});
	}

	return groups;
}
