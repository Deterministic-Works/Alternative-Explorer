import { App, PluginSettingTab, Setting } from "obsidian";
import type AlternativeExplorerPlugin from "./main";
import type { FolderSortBy, FolderSortDir, NoteSortBy, NoteSortDir } from "./constants";

const FOLDER_SORT_OPTIONS: { value: FolderSortBy; label: string }[] = [
	{ value: "name", label: "Name" },
	{ value: "mtime", label: "Modified" },
	{ value: "ctime", label: "Created" },
	{ value: "custom", label: "Custom" },
];

const NOTE_SORT_OPTIONS: { value: NoteSortBy; label: string }[] = [
	{ value: "name", label: "Name" },
	{ value: "mtime", label: "Modified" },
	{ value: "ctime", label: "Created" },
];

const DIR_OPTIONS: { value: "asc" | "desc"; label: string }[] = [
	{ value: "asc", label: "Ascending" },
	{ value: "desc", label: "Descending" },
];

export class AlternativeExplorerSettingTab extends PluginSettingTab {
	plugin: AlternativeExplorerPlugin;

	constructor(app: App, plugin: AlternativeExplorerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Default folder sort").setHeading();
		containerEl.createEl("p", {
			cls: "setting-item-description",
			text: "Used for root folders and nested children unless a folder has its own sort override in the explorer.",
		});

		new Setting(containerEl)
			.setName("Sort folders by")
			.addDropdown((dropdown) => {
				for (const option of FOLDER_SORT_OPTIONS) {
					dropdown.addOption(option.value, option.label);
				}
				dropdown.setValue(this.plugin.settings.folderSortBy);
				dropdown.onChange((value) => {
					void this.setFolderSortBy(value as FolderSortBy);
				});
			});

		new Setting(containerEl)
			.setName("Folder sort direction")
			.addDropdown((dropdown) => {
				for (const option of DIR_OPTIONS) {
					dropdown.addOption(option.value, option.label);
				}
				dropdown.setValue(this.plugin.settings.folderSortDir);
				dropdown.onChange((value) => {
					void this.setFolderSortDir(value as FolderSortDir);
				});
			});

		new Setting(containerEl).setName("Default note sort").setHeading();
		containerEl.createEl("p", {
			cls: "setting-item-description",
			text: "Used for all notes, folders, and smart folders unless that scope has its own sort override in the notes view.",
		});

		new Setting(containerEl)
			.setName("Sort notes by")
			.addDropdown((dropdown) => {
				for (const option of NOTE_SORT_OPTIONS) {
					dropdown.addOption(option.value, option.label);
				}
				dropdown.setValue(this.plugin.settings.sortBy);
				dropdown.onChange((value) => {
					void this.setNoteSortBy(value as NoteSortBy);
				});
			});

		new Setting(containerEl)
			.setName("Note sort direction")
			.addDropdown((dropdown) => {
				for (const option of DIR_OPTIONS) {
					dropdown.addOption(option.value, option.label);
				}
				dropdown.setValue(this.plugin.settings.sortDir);
				dropdown.onChange((value) => {
					void this.setNoteSortDir(value as NoteSortDir);
				});
			});
	}

	private async setFolderSortBy(sortBy: FolderSortBy): Promise<void> {
		if (this.plugin.settings.folderSortBy === sortBy) return;
		this.plugin.settings.folderSortBy = sortBy;
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}

	private async setFolderSortDir(sortDir: FolderSortDir): Promise<void> {
		if (this.plugin.settings.folderSortDir === sortDir) return;
		this.plugin.settings.folderSortDir = sortDir;
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}

	private async setNoteSortBy(sortBy: NoteSortBy): Promise<void> {
		if (this.plugin.settings.sortBy === sortBy) return;
		this.plugin.settings.sortBy = sortBy;
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}

	private async setNoteSortDir(sortDir: NoteSortDir): Promise<void> {
		if (this.plugin.settings.sortDir === sortDir) return;
		this.plugin.settings.sortDir = sortDir;
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}
}
