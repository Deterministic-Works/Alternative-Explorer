import { describe, expect, it } from "vitest";
import { joinVaultPath, nextAvailablePath } from "./create-paths";

describe("joinVaultPath", () => {
	it("returns the child name at the vault root", () => {
		expect(joinVaultPath("", "Notes")).toBe("Notes");
		expect(joinVaultPath("/", "Notes")).toBe("Notes");
	});

	it("joins nested parents with a slash", () => {
		expect(joinVaultPath("Projects", "Notes")).toBe("Projects/Notes");
		expect(joinVaultPath("Projects/Active", "Notes")).toBe("Projects/Active/Notes");
	});
});

describe("nextAvailablePath", () => {
	it("returns the base path when free", () => {
		expect(nextAvailablePath(() => false, "Inbox", "Untitled", "md")).toBe("Inbox/Untitled.md");
		expect(nextAvailablePath(() => false, "/", "Untitled")).toBe("Untitled");
	});

	it("appends an increment when the base path is taken", () => {
		const taken = new Set(["Untitled.md", "Untitled 1.md"]);
		expect(nextAvailablePath((path) => taken.has(path), "/", "Untitled", "md")).toBe(
			"Untitled 2.md"
		);
	});

	it("handles nested folder collisions", () => {
		const taken = new Set(["Projects/New folder"]);
		expect(
			nextAvailablePath((path) => taken.has(path), "Projects", "New folder")
		).toBe("Projects/New folder 1");
	});
});
