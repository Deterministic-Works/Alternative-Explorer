import type { App, TFile } from "obsidian";

type ViewRegistryLike = {
	getTypeByExtension?: (extension: string) => string | undefined;
};

type AppWithViewRegistry = App & {
	viewRegistry?: ViewRegistryLike;
	openWithDefaultApp?: (path: string) => void;
};

/**
 * True when Obsidian (or a plugin) has a view registered for this file's extension.
 */
export function canOpenInObsidian(app: App, file: Pick<TFile, "extension">): boolean {
	const registry = (app as AppWithViewRegistry).viewRegistry;
	if (typeof registry?.getTypeByExtension === "function") {
		const type = registry.getTypeByExtension(file.extension);
		return typeof type === "string" && type.length > 0;
	}
	return file.extension.toLowerCase() === "md";
}

/**
 * Opens a file with the OS default application when Obsidian has no view for it.
 */
export function openWithDefaultApp(app: App, path: string): void {
	const open = (app as AppWithViewRegistry).openWithDefaultApp;
	if (typeof open === "function") {
		open.call(app, path);
	}
}
