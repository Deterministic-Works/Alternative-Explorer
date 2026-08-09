import { Plugin, TFolder, WorkspaceLeaf } from "obsidian";
import {
	AlternativeExplorerSettings,
	VIEW_TYPE_ALTERNATIVE_EXPLORER,
	createDefaultSettings,
} from "./constants";
import { replacePathPrefix } from "./folder-order";
import { AlternativeExplorerView } from "./view";

export default class AlternativeExplorerPlugin extends Plugin {
	settings!: AlternativeExplorerSettings;
	private refreshTimeout: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_ALTERNATIVE_EXPLORER,
			(leaf) => new AlternativeExplorerView(leaf, this)
		);

		this.addRibbonIcon("panels-top-left", "Open Alternative Explorer", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-explorer-view",
			name: "Open explorer view",
			callback: () => {
				void this.activateView();
			},
		});

		this.registerEvent(this.app.vault.on("create", () => this.scheduleRefresh()));
		this.registerEvent(
			this.app.vault.on("delete", () => {
				if (this.ensureCurrentFolderExists()) {
					void this.saveSettings();
				}
				this.scheduleRefresh();
			})
		);
		this.registerEvent(this.app.vault.on("modify", () => this.scheduleRefresh()));
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFolder) {
					void this.remapFolderPath(oldPath, file.path);
				}
				this.scheduleRefresh();
			})
		);
	}

	onunload(): void {
		if (this.refreshTimeout !== null) {
			window.clearTimeout(this.refreshTimeout);
		}
	}

	async loadSettings(): Promise<void> {
		const rootPath = this.app.vault.getRoot().path;
		const defaults = createDefaultSettings(rootPath);
		const saved = await this.loadData() as Partial<AlternativeExplorerSettings> | null;

		this.settings = {
			currentFolder: typeof saved?.currentFolder === "string"
				? saved.currentFolder
				: defaults.currentFolder,
			recursive: typeof saved?.recursive === "boolean" ? saved.recursive : defaults.recursive,
			folderOrder: this.parseFolderOrder(saved?.folderOrder),
		};
		this.ensureCurrentFolderExists();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	refreshViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_ALTERNATIVE_EXPLORER)) {
			if (leaf.view instanceof AlternativeExplorerView) {
				leaf.view.render();
			}
		}
	}

	private scheduleRefresh(): void {
		if (this.refreshTimeout !== null) {
			window.clearTimeout(this.refreshTimeout);
		}
		this.refreshTimeout = window.setTimeout(() => {
			this.refreshTimeout = null;
			this.refreshViews();
		}, 150);
	}

	private async activateView(): Promise<void> {
		const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_ALTERNATIVE_EXPLORER)[0];
		let leaf: WorkspaceLeaf;

		if (existingLeaf) {
			leaf = existingLeaf;
		} else {
			leaf = this.app.workspace.getLeaf("tab");
			await leaf.setViewState({ type: VIEW_TYPE_ALTERNATIVE_EXPLORER, active: true });
		}

		this.app.workspace.revealLeaf(leaf);
	}

	private ensureCurrentFolderExists(): boolean {
		const folder = this.app.vault.getAbstractFileByPath(this.settings.currentFolder);
		if (!(folder instanceof TFolder)) {
			this.settings.currentFolder = this.app.vault.getRoot().path;
			return true;
		}
		return false;
	}

	private async remapFolderPath(oldPath: string, newPath: string): Promise<void> {
		this.settings.currentFolder = replacePathPrefix(
			this.settings.currentFolder,
			oldPath,
			newPath
		);
		const remappedOrder = Object.create(null) as Record<string, string[]>;
		for (const [parentPath, childPaths] of Object.entries(this.settings.folderOrder)) {
			const remappedParent = replacePathPrefix(parentPath, oldPath, newPath);
			remappedOrder[remappedParent] = childPaths.map((path) =>
				replacePathPrefix(path, oldPath, newPath)
			);
		}
		this.settings.folderOrder = remappedOrder;
		await this.saveSettings();
	}

	private parseFolderOrder(value: unknown): Record<string, string[]> {
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return Object.create(null) as Record<string, string[]>;
		}

		const parsed = Object.create(null) as Record<string, string[]>;
		for (const [parentPath, childPaths] of Object.entries(value)) {
			if (!Array.isArray(childPaths)) continue;
			parsed[parentPath] = childPaths.filter(
				(childPath): childPath is string => typeof childPath === "string"
			);
		}
		return parsed;
	}
}
