/** Lucide icon names for common vault file extensions. */
const EXTENSION_ICONS: Record<string, string> = {
	md: "file-text",
	canvas: "layout-dashboard",
	pdf: "file",
	png: "image",
	jpg: "image",
	jpeg: "image",
	gif: "image",
	bmp: "image",
	svg: "image",
	webp: "image",
	mp3: "file-audio",
	wav: "file-audio",
	ogg: "file-audio",
	m4a: "file-audio",
	flac: "file-audio",
	"3gp": "file-audio",
	mp4: "file-video",
	webm: "file-video",
	ogv: "file-video",
	mov: "file-video",
	json: "file-json",
	csv: "table",
	base: "database",
};

/**
 * Returns a Lucide icon name for a vault file extension (no leading dot).
 */
export function iconForFileExtension(extension: string): string {
	const key = extension.trim().toLowerCase();
	return EXTENSION_ICONS[key] ?? "file";
}
