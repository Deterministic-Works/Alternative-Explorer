import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { canOpenInObsidian, openWithDefaultApp } from "./file-openable";

function file(extension: string): Pick<TFile, "extension"> {
	return { extension };
}

describe("canOpenInObsidian", () => {
	it("uses the view registry when available", () => {
		const app = {
			viewRegistry: {
				getTypeByExtension: (ext: string) => (ext === "md" ? "markdown" : undefined),
			},
		} as unknown as App;

		expect(canOpenInObsidian(app, file("md"))).toBe(true);
		expect(canOpenInObsidian(app, file("docx"))).toBe(false);
		expect(canOpenInObsidian(app, file("pdf"))).toBe(false);
	});

	it("treats registered plugin extensions as openable", () => {
		const app = {
			viewRegistry: {
				getTypeByExtension: (ext: string) => (ext === "canvas" ? "canvas" : undefined),
			},
		} as unknown as App;

		expect(canOpenInObsidian(app, file("canvas"))).toBe(true);
	});

	it("falls back to markdown-only without a registry", () => {
		const app = {} as App;
		expect(canOpenInObsidian(app, file("md"))).toBe(true);
		expect(canOpenInObsidian(app, file("MD"))).toBe(true);
		expect(canOpenInObsidian(app, file("png"))).toBe(false);
	});
});

describe("openWithDefaultApp", () => {
	it("calls the app helper when present", () => {
		const open = vi.fn();
		const app = { openWithDefaultApp: open } as unknown as App;
		openWithDefaultApp(app, "Docs/Letter.docx");
		expect(open).toHaveBeenCalledWith("Docs/Letter.docx");
	});

	it("no-ops when the helper is missing", () => {
		expect(() => openWithDefaultApp({} as App, "a.docx")).not.toThrow();
	});
});
