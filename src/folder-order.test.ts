import { describe, expect, it } from "vitest";
import {
	mergeFolderOrder,
	moveFolderRelative,
	replacePathPrefix,
} from "./folder-order";

describe("mergeFolderOrder", () => {
	it("keeps known manual order, removes missing folders, and appends new folders", () => {
		expect(
			mergeFolderOrder(["Projects", "Archive", "Missing"], ["Archive", "Inbox", "Projects"])
		).toEqual(["Projects", "Archive", "Inbox"]);
	});

	it("sorts unplaced folders case-insensitively", () => {
		expect(mergeFolderOrder(undefined, ["zeta", "Alpha", "beta"])).toEqual([
			"Alpha",
			"beta",
			"zeta",
		]);
	});
});

describe("manual moves", () => {
	it("moves a dragged folder before or after its drop target", () => {
		expect(moveFolderRelative(["a", "b", "c"], "c", "a", "before")).toEqual([
			"c",
			"a",
			"b",
		]);
		expect(moveFolderRelative(["a", "b", "c"], "a", "c", "after")).toEqual([
			"b",
			"c",
			"a",
		]);
	});
});

describe("replacePathPrefix", () => {
	it("updates a folder and all of its descendants without touching similar paths", () => {
		expect(replacePathPrefix("Projects", "Projects", "Work")).toBe("Work");
		expect(replacePathPrefix("Projects/App/Notes", "Projects", "Work")).toBe(
			"Work/App/Notes"
		);
		expect(replacePathPrefix("Projects old", "Projects", "Work")).toBe("Projects old");
	});
});
