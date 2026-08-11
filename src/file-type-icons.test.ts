import { describe, expect, it } from "vitest";
import { iconForFileExtension } from "./file-type-icons";

describe("iconForFileExtension", () => {
	it("maps markdown and canvas", () => {
		expect(iconForFileExtension("md")).toBe("file-text");
		expect(iconForFileExtension("MD")).toBe("file-text");
		expect(iconForFileExtension("canvas")).toBe("layout-dashboard");
	});

	it("maps images, audio, and video", () => {
		expect(iconForFileExtension("png")).toBe("image");
		expect(iconForFileExtension("jpeg")).toBe("image");
		expect(iconForFileExtension("mp3")).toBe("file-audio");
		expect(iconForFileExtension("mp4")).toBe("file-video");
	});

	it("maps pdf, json, csv, and bases", () => {
		expect(iconForFileExtension("pdf")).toBe("file");
		expect(iconForFileExtension("json")).toBe("file-json");
		expect(iconForFileExtension("csv")).toBe("table");
		expect(iconForFileExtension("base")).toBe("database");
	});

	it("falls back for unknown extensions", () => {
		expect(iconForFileExtension("docx")).toBe("file");
		expect(iconForFileExtension("")).toBe("file");
		expect(iconForFileExtension("  ")).toBe("file");
	});
});
