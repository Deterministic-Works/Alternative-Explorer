import { describe, expect, it } from "vitest";
import {
	mergeFolderOrder,
	moveFolderBefore,
	moveFolderBy,
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
	it("moves a folder one position", () => {
		expect(moveFolderBy(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
		expect(moveFolderBy(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
	});

	it("moves a dragged folder before its drop target", () => {
		expect(moveFolderBefore(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
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
