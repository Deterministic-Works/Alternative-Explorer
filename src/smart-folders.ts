import type {
	SmartFolder,
	SmartFolderField,
	SmartFolderMatch,
	SmartFolderOperator,
	SmartFolderRule,
} from "./constants";

export interface SmartFolderNoteSnapshot {
	path: string;
	name: string;
	ctime: number;
	mtime: number;
	tags: string[];
	frontmatter: Record<string, unknown>;
}

const BUILTIN_FIELDS = new Set<string>(["tags", "name", "path", "ctime", "mtime"]);

const OPERATORS = new Set<SmartFolderOperator>([
	"equals",
	"not-equals",
	"contains",
	"not-contains",
	"exists",
	"not-exists",
	"starts-with",
	"ends-with",
	"before",
	"after",
	"on",
]);

const DATE_OPERATORS = new Set<SmartFolderOperator>(["before", "after", "on"]);
const STRING_OPERATORS = new Set<SmartFolderOperator>([
	"equals",
	"not-equals",
	"contains",
	"not-contains",
	"starts-with",
	"ends-with",
]);

export function createSmartFolderId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `smart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createSmartFolderRule(
	partial?: Partial<Omit<SmartFolderRule, "id">> & { id?: string }
): SmartFolderRule {
	return {
		id: partial?.id ?? createSmartFolderId(),
		field: partial?.field ?? "tags",
		operator: partial?.operator ?? "contains",
		value: partial?.value ?? "",
	};
}

export function createSmartFolder(
	name: string,
	options?: {
		id?: string;
		match?: SmartFolderMatch;
		rules?: SmartFolderRule[];
	}
): SmartFolder {
	return {
		id: options?.id ?? createSmartFolderId(),
		name: name.trim() || "Untitled",
		match: options?.match === "any" ? "any" : "all",
		rules: options?.rules ? options.rules.map((rule) => ({ ...rule })) : [],
	};
}

export function parseSmartFolderField(value: unknown): SmartFolderField | null {
	if (typeof value !== "string" || value.length === 0) return null;
	if (BUILTIN_FIELDS.has(value)) {
		return value as SmartFolderField;
	}
	if (value.startsWith("frontmatter:")) {
		const key = value.slice("frontmatter:".length).trim();
		if (key.length === 0) return null;
		return `frontmatter:${key}`;
	}
	return null;
}

export function parseSmartFolderOperator(value: unknown): SmartFolderOperator | null {
	if (typeof value !== "string") return null;
	return OPERATORS.has(value as SmartFolderOperator) ? (value as SmartFolderOperator) : null;
}

export function parseSmartFolder(value: unknown): SmartFolder | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const record = value as Record<string, unknown>;
	if (typeof record.id !== "string" || record.id.length === 0) return null;
	if (typeof record.name !== "string") return null;
	const match: SmartFolderMatch = record.match === "any" ? "any" : "all";
	const rules: SmartFolderRule[] = [];
	if (Array.isArray(record.rules)) {
		for (const entry of record.rules) {
			const rule = parseSmartFolderRule(entry);
			if (rule) rules.push(rule);
		}
	}
	return {
		id: record.id,
		name: record.name.trim() || "Untitled",
		match,
		rules,
	};
}

export function parseSmartFolderRule(value: unknown): SmartFolderRule | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const record = value as Record<string, unknown>;
	if (typeof record.id !== "string" || record.id.length === 0) return null;
	const field = parseSmartFolderField(record.field);
	const operator = parseSmartFolderOperator(record.operator);
	if (!field || !operator) return null;
	return {
		id: record.id,
		field,
		operator,
		value: typeof record.value === "string" ? record.value : "",
	};
}

export function noteMatchesSmartFolder(
	note: SmartFolderNoteSnapshot,
	folder: SmartFolder
): boolean {
	if (folder.rules.length === 0) return false;
	if (folder.match === "any") {
		return folder.rules.some((rule) => noteMatchesRule(note, rule));
	}
	return folder.rules.every((rule) => noteMatchesRule(note, rule));
}

export function filterNotesBySmartFolder<T extends SmartFolderNoteSnapshot>(
	notes: readonly T[],
	folder: SmartFolder
): T[] {
	return notes.filter((note) => noteMatchesSmartFolder(note, folder));
}

export function noteMatchesRule(note: SmartFolderNoteSnapshot, rule: SmartFolderRule): boolean {
	const fieldKind = fieldKindOf(rule.field);

	if (rule.operator === "exists" || rule.operator === "not-exists") {
		const exists = fieldExists(note, rule.field);
		return rule.operator === "exists" ? exists : !exists;
	}

	if (fieldKind === "date") {
		if (!DATE_OPERATORS.has(rule.operator)) return false;
		return matchDate(noteTimestamp(note, rule.field), rule.operator, rule.value);
	}

	if (!STRING_OPERATORS.has(rule.operator)) return false;

	const values = fieldStringValues(note, rule.field);
	if (values.length === 0) {
		return rule.operator === "not-equals" || rule.operator === "not-contains";
	}

	const needle = rule.value;
	switch (rule.operator) {
		case "equals":
			return values.some((value) => equalsIgnoreCase(value, needle));
		case "not-equals":
			return values.every((value) => !equalsIgnoreCase(value, needle));
		case "contains":
			return values.some((value) => containsIgnoreCase(value, needle));
		case "not-contains":
			return values.every((value) => !containsIgnoreCase(value, needle));
		case "starts-with":
			return values.some((value) => startsWithIgnoreCase(value, needle));
		case "ends-with":
			return values.some((value) => endsWithIgnoreCase(value, needle));
		default:
			return false;
	}
}

function fieldKindOf(field: SmartFolderField): "string" | "date" | "tags" {
	if (field === "ctime" || field === "mtime") return "date";
	if (field === "tags") return "tags";
	return "string";
}

function fieldExists(note: SmartFolderNoteSnapshot, field: SmartFolderField): boolean {
	if (field === "tags") return note.tags.length > 0;
	if (field === "name") return note.name.length > 0;
	if (field === "path") return note.path.length > 0;
	if (field === "ctime") return Number.isFinite(note.ctime);
	if (field === "mtime") return Number.isFinite(note.mtime);
	const key = frontmatterKey(field);
	if (!key) return false;
	const value = note.frontmatter[key];
	if (value === undefined || value === null) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "string") return value.length > 0;
	return true;
}

function noteTimestamp(note: SmartFolderNoteSnapshot, field: SmartFolderField): number {
	return field === "ctime" ? note.ctime : note.mtime;
}

function fieldStringValues(note: SmartFolderNoteSnapshot, field: SmartFolderField): string[] {
	if (field === "tags") {
		return note.tags.map(normalizeTag);
	}
	if (field === "name") return note.name ? [note.name] : [];
	if (field === "path") return note.path ? [note.path] : [];
	if (field === "ctime" || field === "mtime") return [];

	const key = frontmatterKey(field);
	if (!key) return [];
	return coerceToStrings(note.frontmatter[key]);
}

function frontmatterKey(field: SmartFolderField): string | null {
	if (!field.startsWith("frontmatter:")) return null;
	const key = field.slice("frontmatter:".length).trim();
	return key.length > 0 ? key : null;
}

function coerceToStrings(value: unknown): string[] {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) {
		return value.flatMap((entry) => coerceToStrings(entry));
	}
	if (typeof value === "boolean" || typeof value === "number") {
		return [String(value)];
	}
	if (typeof value === "string") {
		return value.length > 0 ? [value] : [];
	}
	if (typeof value === "object") {
		try {
			return [JSON.stringify(value)];
		} catch {
			return [];
		}
	}
	return [];
}

function normalizeTag(tag: string): string {
	const trimmed = tag.trim();
	if (trimmed.startsWith("#")) return trimmed.slice(1);
	return trimmed;
}

function equalsIgnoreCase(left: string, right: string): boolean {
	return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function containsIgnoreCase(value: string, needle: string): boolean {
	if (needle.length === 0) return true;
	return value.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

function startsWithIgnoreCase(value: string, needle: string): boolean {
	if (needle.length === 0) return true;
	return value.toLocaleLowerCase().startsWith(needle.toLocaleLowerCase());
}

function endsWithIgnoreCase(value: string, needle: string): boolean {
	if (needle.length === 0) return true;
	return value.toLocaleLowerCase().endsWith(needle.toLocaleLowerCase());
}

function matchDate(
	timestamp: number,
	operator: SmartFolderOperator,
	rawValue: string
): boolean {
	if (!Number.isFinite(timestamp)) return false;
	const target = parseDayBound(rawValue);
	if (!target) return false;

	const noteDay = startOfLocalDay(timestamp);
	if (operator === "on") {
		return noteDay === target.start;
	}
	if (operator === "before") {
		return timestamp < target.start;
	}
	if (operator === "after") {
		return timestamp >= target.end;
	}
	return false;
}

function parseDayBound(rawValue: string): { start: number; end: number } | null {
	const trimmed = rawValue.trim();
	if (!trimmed) return null;

	const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
	if (ymd) {
		const year = Number(ymd[1]);
		const month = Number(ymd[2]) - 1;
		const day = Number(ymd[3]);
		const start = new Date(year, month, day).getTime();
		if (!Number.isFinite(start)) return null;
		const end = new Date(year, month, day + 1).getTime();
		return { start, end };
	}

	const parsed = Date.parse(trimmed);
	if (!Number.isFinite(parsed)) return null;
	const start = startOfLocalDay(parsed);
	const end = start + 24 * 60 * 60 * 1000;
	return { start, end };
}

function startOfLocalDay(timestamp: number): number {
	const date = new Date(timestamp);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
