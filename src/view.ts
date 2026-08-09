import { ItemView, TFile, TFolder, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type AlternativeExplorerPlugin from "./main";
import { VIEW_TYPE_ALTERNATIVE_EXPLORER } from "./constants";
import { mergeFolderOrder, moveFolderRelative } from "./folder-order";

type FolderAction = "navigate";

export class AlternativeExplorerView extends ItemView {
	private draggedFolderPath: string | null = null;

	constructor(leaf: WorkspaceLeaf, private readonly plugin: AlternativeExplorerPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_ALTERNATIVE_EXPLORER;
	}

	getDisplayText(): string {
		return "Alternative Explorer";
	}

	getIcon(): string {
		return "panels-top-left";
	}

	async onOpen(): Promise<void> {
		this.contentEl.addClass("alternative-explorer-view");
		this.registerInteractions();
		this.render();
	}

	async onClose(): Promise<void> {
		this.draggedFolderPath = null;
	}

	render(): void {
		const currentFolder = this.resolveCurrentFolder();
		const container = this.contentEl;
		container.empty();

		const browser = container.createEl("main", { cls: "alternative-explorer-browser" });
		this.renderHeader(browser, currentFolder);
		this.renderFolders(browser, currentFolder);
		this.renderFiles(browser, currentFolder);
	}

	private registerInteractions(): void {
		this.registerDomEvent(this.contentEl, "click", (event) => {
			const element = event.target as HTMLElement;
			const folderControl = element.closest<HTMLButtonElement>("button[data-folder-action]");
			if (folderControl) {
				event.preventDefault();
				const path = folderControl.dataset.folderPath;
				const action = folderControl.dataset.folderAction as FolderAction | undefined;
				if (path && action) {
					void this.handleFolderAction(path, action);
				}
				return;
			}

			const modeControl = element.closest<HTMLButtonElement>("button[data-recursive]");
			if (modeControl) {
				event.preventDefault();
				void this.setRecursive(modeControl.dataset.recursive === "true");
				return;
			}

			const fileControl = element.closest<HTMLButtonElement>("button[data-file-path]");
			if (fileControl?.dataset.filePath) {
				event.preventDefault();
				void this.openFile(fileControl.dataset.filePath);
			}
		});

		this.registerDomEvent(this.contentEl, "dragstart", (event) => {
			const row = (event.target as HTMLElement).closest<HTMLElement>(
				".alternative-explorer-folder-row[data-folder-path]"
			);
			const path = row?.dataset.folderPath;
			if (!row || !path) {
				event.preventDefault();
				return;
			}

			this.draggedFolderPath = path;
			event.dataTransfer?.setData("text/plain", path);
			if (event.dataTransfer) {
				event.dataTransfer.effectAllowed = "move";
			}
			row.addClass("is-dragging");
		});

		this.registerDomEvent(this.contentEl, "dragover", (event) => {
			const row = this.getValidDropTarget(event.target);
			if (!row) return;
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = "move";
			}
			this.clearDropTargets();
			row.addClass(
				event.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2
					? "is-drop-before"
					: "is-drop-after"
			);
		});

		this.registerDomEvent(this.contentEl, "drop", (event) => {
			const row = this.getValidDropTarget(event.target);
			const targetPath = row?.dataset.folderPath;
			if (!targetPath || !this.draggedFolderPath) return;
			event.preventDefault();
			const position = row.hasClass("is-drop-after") ? "after" : "before";
			void this.moveFolderRelativeToTarget(this.draggedFolderPath, targetPath, position);
			this.finishDrag();
		});

		this.registerDomEvent(this.contentEl, "dragend", () => {
			this.finishDrag();
		});
	}

	private renderHeader(container: HTMLElement, folder: TFolder): void {
		const header = container.createEl("header", { cls: "alternative-explorer-header" });
		const navigation = header.createDiv({ cls: "alternative-explorer-navigation" });

		if (folder.parent) {
			const backButton = navigation.createEl("button", {
				cls: "alternative-explorer-back-button",
				attr: {
					type: "button",
					"data-folder-action": "navigate",
					"data-folder-path": folder.parent.path,
					"aria-label": `Back to ${this.folderName(folder.parent)}`,
				},
			});
			setIcon(backButton, "arrow-left");
		}

		this.renderBreadcrumbs(navigation, folder);

		const heading = header.createDiv({ cls: "alternative-explorer-heading" });
		const titleGroup = heading.createDiv({ cls: "alternative-explorer-title-group" });
		titleGroup.createEl("h1", { text: this.folderName(folder) });
		this.renderModeToggle(heading);
	}

	private renderFolders(container: HTMLElement, folder: TFolder): void {
		const folders = this.getOrderedSubfolders(folder);
		if (folders.length === 0) return;

		const section = container.createEl("section", {
			cls: "alternative-explorer-section alternative-explorer-folder-section",
			attr: { "aria-label": "Folders" },
		});
		const sectionHeader = section.createDiv({ cls: "alternative-explorer-section-header" });
		const label = sectionHeader.createDiv({ cls: "alternative-explorer-section-label" });
		label.createEl("h2", { text: "Folders" });
		label.createSpan({ text: String(folders.length), attr: { "aria-label": `${folders.length} folders` } });
		sectionHeader.createDiv({
			cls: "alternative-explorer-section-hint",
			text: "Drag to reorder",
		});

		const list = section.createDiv({ cls: "alternative-explorer-folder-list" });
		for (const child of folders) {
			const row = list.createDiv({
				cls: "alternative-explorer-folder-row",
				attr: {
					draggable: "true",
					"data-folder-path": child.path,
					"data-parent-path": folder.path,
				},
			});
			const navigateButton = row.createEl("button", {
				cls: "alternative-explorer-folder-button",
				attr: {
					type: "button",
					"data-folder-action": "navigate",
					"data-folder-path": child.path,
					title: child.path,
				},
			});
			const icon = navigateButton.createSpan({ cls: "alternative-explorer-row-icon" });
			setIcon(icon, "folder");
			const copy = navigateButton.createSpan({ cls: "alternative-explorer-folder-copy" });
			copy.createSpan({ cls: "alternative-explorer-folder-name", text: child.name });
			copy.createSpan({ cls: "alternative-explorer-folder-meta", text: this.folderSummary(child) });
			const arrow = navigateButton.createSpan({ cls: "alternative-explorer-row-arrow" });
			setIcon(arrow, "chevron-right");
			const dragHandle = row.createSpan({
				cls: "alternative-explorer-drag-handle",
				attr: { "aria-hidden": "true" },
			});
			setIcon(dragHandle, "grip-vertical");
		}
	}

	private renderFiles(container: HTMLElement, folder: TFolder): void {
		const files = this.getFiles(folder, this.plugin.settings.recursive);
		const section = container.createEl("section", {
			cls: "alternative-explorer-section alternative-explorer-file-section",
			attr: { "aria-label": "Notes" },
		});
		const sectionHeader = section.createDiv({ cls: "alternative-explorer-section-header" });
		const label = sectionHeader.createDiv({ cls: "alternative-explorer-section-label" });
		label.createEl("h2", { text: "Notes" });
		label.createSpan({
			text: String(files.length),
			attr: { "aria-label": `${files.length} ${files.length === 1 ? "note" : "notes"}` },
		});

		if (files.length === 0) {
			const empty = section.createDiv({ cls: "alternative-explorer-empty" });
			const icon = empty.createSpan();
			setIcon(icon, "file-text");
			empty.createDiv({ text: "No notes here yet" });
			empty.createEl("p", {
				text: this.plugin.settings.recursive
					? "This folder and its subfolders are empty."
					: "Switch to All below to include notes in subfolders.",
			});
			return;
		}

		const list = section.createDiv({ cls: "alternative-explorer-file-list" });
		for (const file of files) {
			const row = list.createEl("button", {
				cls: "alternative-explorer-file-row",
				attr: {
					type: "button",
					"data-file-path": file.path,
					title: file.path,
				},
			});
			const icon = row.createSpan({ cls: "alternative-explorer-row-icon" });
			setIcon(icon, "file-text");
			const copy = row.createSpan({ cls: "alternative-explorer-file-copy" });
			copy.createSpan({ cls: "alternative-explorer-file-title", text: file.basename });
			if (this.plugin.settings.recursive && file.parent?.path !== folder.path) {
				copy.createSpan({
					cls: "alternative-explorer-file-location",
					text: this.relativeParentPath(folder, file),
				});
			}
			row.createEl("time", {
				cls: "alternative-explorer-file-date",
				text: moment(file.stat.mtime).format("MMM D, YYYY"),
				attr: {
					datetime: moment(file.stat.mtime).toISOString(),
					title: moment(file.stat.mtime).format("YYYY-MM-DD HH:mm"),
				},
			});
			const arrow = row.createSpan({ cls: "alternative-explorer-row-arrow" });
			setIcon(arrow, "arrow-up-right");
		}
	}

	private renderBreadcrumbs(container: HTMLElement, folder: TFolder): void {
		const breadcrumbs = container.createEl("nav", {
			cls: "alternative-explorer-breadcrumbs",
			attr: { "aria-label": "Current folder" },
		});
		const lineage: TFolder[] = [];
		let cursor: TFolder | null = folder;
		while (cursor) {
			lineage.unshift(cursor);
			cursor = cursor.parent;
		}

		lineage.forEach((ancestor, index) => {
			if (index > 0) {
				const separator = breadcrumbs.createSpan({ cls: "alternative-explorer-breadcrumb-separator" });
				setIcon(separator, "chevron-right");
			}
			breadcrumbs.createEl("button", {
				text: this.folderName(ancestor),
				attr: {
					type: "button",
					"data-folder-action": "navigate",
					"data-folder-path": ancestor.path,
					"aria-current": ancestor.path === folder.path ? "page" : "false",
				},
			});
		});
	}

	private renderModeToggle(container: HTMLElement): void {
		const toggle = container.createDiv({
			cls: "alternative-explorer-mode-toggle",
			attr: { role: "group", "aria-label": "Notes to show" },
		});
		for (const [recursive, label] of [
			[false, "This folder"],
			[true, "All below"],
		] as const) {
			toggle.createEl("button", {
				cls: recursive === this.plugin.settings.recursive ? "is-active" : "",
				text: label,
				attr: {
					type: "button",
					"data-recursive": String(recursive),
					"aria-pressed": String(recursive === this.plugin.settings.recursive),
				},
			});
		}
	}

	private async handleFolderAction(path: string, action: FolderAction): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder)) return;

		this.plugin.settings.currentFolder = folder.path;

		await this.plugin.saveSettings();
		this.render();
	}

	private async setRecursive(recursive: boolean): Promise<void> {
		if (this.plugin.settings.recursive === recursive) return;
		this.plugin.settings.recursive = recursive;
		await this.plugin.saveSettings();
		this.render();
	}

	private async moveFolderRelativeToTarget(
		folderPath: string,
		targetPath: string,
		position: "after" | "before"
	): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		const target = this.app.vault.getAbstractFileByPath(targetPath);
		if (!(folder instanceof TFolder) || !(target instanceof TFolder)) return;
		if (folder.parent?.path !== target.parent?.path) return;

		const parent = folder.parent ?? this.app.vault.getRoot();
		const order = this.getOrderedSubfolders(parent).map((sibling) => sibling.path);
		this.plugin.settings.folderOrder[parent.path] = moveFolderRelative(
			order,
			folder.path,
			target.path,
			position
		);
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}

	private async openFile(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		await this.app.workspace.getLeaf("tab").openFile(file);
	}

	private resolveCurrentFolder(): TFolder {
		const selected = this.app.vault.getAbstractFileByPath(this.plugin.settings.currentFolder);
		if (selected instanceof TFolder) {
			return selected;
		}

		const root = this.app.vault.getRoot();
		this.plugin.settings.currentFolder = root.path;
		return root;
	}

	private getOrderedSubfolders(folder: TFolder): TFolder[] {
		const folders = folder.children.filter((child): child is TFolder => child instanceof TFolder);
		const byPath = new Map(folders.map((child) => [child.path, child]));
		return mergeFolderOrder(
			this.plugin.settings.folderOrder[folder.path],
			folders.map((child) => child.path)
		)
			.map((path) => byPath.get(path))
			.filter((child): child is TFolder => child !== undefined);
	}

	private getFiles(folder: TFolder, recursive: boolean): TFile[] {
		const files: TFile[] = [];
		const visit = (current: TFolder): void => {
			for (const child of current.children) {
				if (child instanceof TFile) {
					files.push(child);
				} else if (recursive && child instanceof TFolder) {
					visit(child);
				}
			}
		};
		visit(folder);
		return files.sort((left, right) =>
			left.path.localeCompare(right.path, undefined, { sensitivity: "base" })
		);
	}

	private folderName(folder: TFolder): string {
		return folder.isRoot() ? "Vault" : folder.name;
	}

	private folderSummary(folder: TFolder): string {
		const folders = folder.children.filter((child) => child instanceof TFolder).length;
		const files = folder.children.filter((child) => child instanceof TFile).length;
		const parts: string[] = [];
		if (folders > 0) parts.push(`${folders} ${folders === 1 ? "folder" : "folders"}`);
		if (files > 0) parts.push(`${files} ${files === 1 ? "note" : "notes"}`);
		return parts.length > 0 ? parts.join(" · ") : "Empty folder";
	}

	private relativeParentPath(folder: TFolder, file: TFile): string {
		const parentPath = file.parent?.path ?? "";
		if (folder.isRoot()) return parentPath;
		return parentPath.slice(folder.path.length + 1);
	}

	private getValidDropTarget(target: EventTarget | null): HTMLElement | null {
		const row = (target as HTMLElement | null)?.closest<HTMLElement>(
			".alternative-explorer-folder-row[data-folder-path]"
		);
		if (!row || !this.draggedFolderPath) return null;
		if (row.dataset.folderPath === this.draggedFolderPath) return null;

		const dragged = this.app.vault.getAbstractFileByPath(this.draggedFolderPath);
		return dragged instanceof TFolder && dragged.parent?.path === row.dataset.parentPath ? row : null;
	}

	private clearDropTargets(): void {
		this.contentEl
			.querySelectorAll(".is-drop-before, .is-drop-after")
			.forEach((element) => {
				element.removeClass("is-drop-before");
				element.removeClass("is-drop-after");
			});
	}

	private finishDrag(): void {
		this.draggedFolderPath = null;
		this.clearDropTargets();
		this.contentEl
			.querySelectorAll(".is-dragging")
			.forEach((element) => element.removeClass("is-dragging"));
	}
}
