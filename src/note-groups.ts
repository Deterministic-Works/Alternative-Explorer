export interface NoteLike {
	path: string;
	mtime: number;
}

export interface NoteGroup<T extends NoteLike = NoteLike> {
	id: string;
	label: string;
	notes: T[];
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

function compareNewestFirst<T extends NoteLike>(left: T, right: T): number {
	return right.mtime - left.mtime || left.path.localeCompare(right.path, undefined, {
		sensitivity: "base",
	});
}

/**
 * Groups notes into Apple Notes–style recency buckets.
 * Pinned notes (by path) appear first and are excluded from date buckets.
 */
export function groupNotesByRecency<T extends NoteLike>(
	notes: readonly T[],
	pinnedPaths: ReadonlySet<string>,
	now: Date = new Date()
): NoteGroup<T>[] {
	const pinned: T[] = [];
	const unpinned: T[] = [];

	for (const note of notes) {
		if (pinnedPaths.has(note.path)) {
			pinned.push(note);
		} else {
			unpinned.push(note);
		}
	}

	pinned.sort(compareNewestFirst);
	unpinned.sort(compareNewestFirst);

	const todayStart = startOfLocalDay(now);
	const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
	const previous7Start = new Date(todayStart.getTime() - 7 * DAY_MS);
	const previous30Start = new Date(todayStart.getTime() - 30 * DAY_MS);

	const today: T[] = [];
	const yesterday: T[] = [];
	const previous7: T[] = [];
	const previous30: T[] = [];
	const months = new Map<string, { label: string; notes: T[] }>();

	for (const note of unpinned) {
		const modified = new Date(note.mtime);
		if (modified >= todayStart) {
			today.push(note);
			continue;
		}
		if (modified >= yesterdayStart) {
			yesterday.push(note);
			continue;
		}
		if (modified >= previous7Start) {
			previous7.push(note);
			continue;
		}
		if (modified >= previous30Start) {
			previous30.push(note);
			continue;
		}

		const key = monthKey(modified);
		const existing = months.get(key);
		if (existing) {
			existing.notes.push(note);
		} else {
			months.set(key, { label: monthLabel(modified), notes: [note] });
		}
	}

	const groups: NoteGroup<T>[] = [];
	if (pinned.length > 0) {
		groups.push({ id: "pinned", label: "Pinned", notes: pinned });
	}
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
