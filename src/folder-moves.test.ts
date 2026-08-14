import { describe, expect, it } from "vitest";
import {
	destinationFolderPath,
	isInvalidMoveParent,
	resolveVaultFolderDrop,
} from "./folder-moves";

describe("isInvalidMoveParent", () => {
	it("rejects the source folder itself and its descendants", () => {
		expect(isInvalidMoveParent("Projects", "Projects")).toBe(true);
		expect(isInvalidMoveParent("Projects", "Projects/App")).toBe(true);
		expect(isInvalidMoveParent("Projects", "Projects/App/Notes")).toBe(true);
	});

	it("allows unrelated parents and ancestors", () => {
		expect(isInvalidMoveParent("Projects", "/")).toBe(false);
		expect(isInvalidMoveParent("Projects", "Inbox")).toBe(false);
		expect(isInvalidMoveParent("Projects/App", "Projects")).toBe(false);
		expect(isInvalidMoveParent("Projects", "Projectsx")).toBe(false);
	});
});

describe("destinationFolderPath", () => {
	it("joins under the vault root and nested parents", () => {
		expect(destinationFolderPath("/", "Notes")).toBe("Notes");
		expect(destinationFolderPath("", "Notes")).toBe("Notes");
		expect(destinationFolderPath("Projects", "Notes")).toBe("Projects/Notes");
	});
});

describe("resolveVaultFolderDrop", () => {
	const base = {
		sourcePath: "Inbox",
		sourceParentPath: "/",
		rootPath: "/",
		unassignedSectionId: "",
		sameParentCustomSort: true,
		sectionId: "",
	};

	it("moves into another vault folder", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				position: "into",
				dropKind: "folder",
				targetPath: "Projects",
				targetParentPath: "/",
				allowsInto: true,
			})
		).toEqual({
			kind: "vault-move",
			destParentPath: "Projects",
			relativeTargetKey: null,
			position: "into",
			rootSectionId: null,
		});
	});

	it("rejects into when the target is invalid or already the parent", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				sourcePath: "Projects",
				position: "into",
				dropKind: "folder",
				targetPath: "Projects/App",
				allowsInto: true,
			})
		).toBeNull();
		expect(
			resolveVaultFolderDrop({
				...base,
				sourcePath: "Projects/App",
				sourceParentPath: "Projects",
				position: "into",
				dropKind: "folder",
				targetPath: "Projects",
				allowsInto: true,
			})
		).toBeNull();
		expect(
			resolveVaultFolderDrop({
				...base,
				position: "into",
				dropKind: "folder",
				targetPath: "smart:a",
				allowsInto: false,
			})
		).toBeNull();
	});

	it("reorders siblings under the same parent when custom sort is on", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				position: "before",
				dropKind: "folder",
				targetPath: "Projects",
				targetParentPath: "/",
			})
		).toEqual({
			kind: "display",
			position: "before",
			targetPath: "Projects",
		});
	});

	it("returns null for same-parent reorder when custom sort is off", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				sameParentCustomSort: false,
				position: "after",
				dropKind: "folder",
				targetPath: "Projects",
				targetParentPath: "/",
			})
		).toBeNull();
	});

	it("moves as a sibling when parents differ", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				sourcePath: "Projects/App",
				sourceParentPath: "Projects",
				position: "before",
				dropKind: "folder",
				targetPath: "Inbox",
				targetParentPath: "/",
				sectionId: "work",
			})
		).toEqual({
			kind: "vault-move",
			destParentPath: "/",
			relativeTargetKey: "Inbox",
			position: "before",
			rootSectionId: "work",
		});
	});

	it("moves a nested folder to the vault root via a section zone", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				sourcePath: "Projects/App",
				sourceParentPath: "Projects",
				position: "after",
				dropKind: "zone",
				sectionId: "life",
			})
		).toEqual({
			kind: "vault-move",
			destParentPath: "/",
			relativeTargetKey: null,
			position: "after",
			rootSectionId: "life",
		});
	});

	it("treats a root folder dropped on a zone as display section assignment", () => {
		expect(
			resolveVaultFolderDrop({
				...base,
				position: "before",
				dropKind: "zone",
				sectionId: "",
			})
		).toEqual({
			kind: "display",
			position: "before",
			targetPath: null,
		});
	});
});
