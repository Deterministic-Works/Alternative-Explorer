import { ItemView, TFile, TFolder, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type AlternativeExplorerPlugin from "./main";
import { VIEW_TYPE_ALTERNATIVE_EXPLORER } from "./constants";
import { mergeFolderOrder, moveFolderBefore, moveFolderBy } from "./folder-order";

type FolderAction = "expand" | "move-down" | "move-up" | "navigate";

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

		const layout = container.createDiv({ cls: "alternative-explorer-layout" });
		this.renderTree(layout, currentFolder);
		this.renderContent(layout, currentFolder);
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
				".alternative-explorer-tree-row[data-folder-path]"
			);
			const path = row?.dataset.folderPath;
			if (!row || !path || row.dataset.root === "true") {
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
			row.addClass("is-drop-target");
		});

		this.registerDomEvent(this.contentEl, "drop", (event) => {
			const row = this.getValidDropTarget(event.target);
			const targetPath = row?.dataset.folderPath;
			if (!targetPath || !this.draggedFolderPath) return;
			event.preventDefault();
			void this.moveFolderBeforeTarget(this.draggedFolderPath, targetPath);
			this.finishDrag();
		});

		this.registerDomEvent(this.contentEl, "dragend", () => {
			this.finishDrag();
		});
	}

	private renderTree(layout: HTMLElement, currentFolder: TFolder): void {
		const pane = layout.createEl("nav", {
			cls: "alternative-explorer-tree-pane",
			attr: { "aria-label": "Folder tree" },
		});
		const heading = pane.createDiv({ cls: "alternative-explorer-pane-heading" });
		heading.createEl("h2", { text: "Folders" });
		heading.createEl("span", { text: "Drag or use arrows to reorder" });

		const tree = pane.createEl("ul", {
			cls: "alternative-explorer-tree",
			attr: { role: "tree" },
		});
		this.renderFolderNode(tree, this.app.vault.getRoot(), currentFolder, true);
	}

	private renderFolderNode(
		parent: HTMLElement,
		folder: TFolder,
		currentFolder: TFolder,
		isRoot = false
	): void {
		const subfolders = this.getOrderedSubfolders(folder);
		const isExpanded = this.plugin.settings.expandedFolders.includes(folder.path);
		const item = parent.createEl("li", {
			cls: "alternative-explorer-tree-item",
			attr: {
				role: "treeitem",
				"aria-expanded": subfolders.length > 0 ? String(isExpanded) : "false",
			},
		});
		const row = item.createDiv({
			cls: `alternative-explorer-tree-row${
				folder.path === currentFolder.path ? " is-current" : ""
			}`,
			attr: {
				draggable: String(!isRoot),
				"data-folder-path": folder.path,
				"data-parent-path": folder.parent?.path ?? "",
				"data-root": String(isRoot),
			},
		});

		const expandButton = row.createEl("button", {
			cls: "alternative-explorer-icon-button alternative-explorer-expand",
			attr: {
				type: "button",
				"data-folder-action": "expand",
				"data-folder-path": folder.path,
				"aria-label": `${isExpanded ? "Collapse" : "Expand"} ${this.folderName(folder)}`,
			},
		});
		expandButton.disabled = subfolders.length === 0;
		if (subfolders.length > 0) {
			setIcon(expandButton, isExpanded ? "chevron-down" : "chevron-right");
		}

		const navigateButton = row.createEl("button", {
			cls: "alternative-explorer-folder-button",
			text: this.folderName(folder),
			attr: {
				type: "button",
				"data-folder-action": "navigate",
				"data-folder-path": folder.path,
				title: isRoot ? "Vault root" : folder.path,
			},
		});
		if (folder.path === currentFolder.path) {
			navigateButton.setAttribute("aria-current", "page");
		}

		if (!isRoot) {
			const siblings = this.getOrderedSubfolders(folder.parent ?? this.app.vault.getRoot());
			const siblingIndex = siblings.findIndex((sibling) => sibling.path === folder.path);
			const orderControls = row.createDiv({ cls: "alternative-explorer-order-controls" });
			this.createOrderButton(orderControls, folder, "move-up", "chevron-up", siblingIndex === 0);
			this.createOrderButton(
				orderControls,
				folder,
				"move-down",
				"chevron-down",
				siblingIndex === siblings.length - 1
			);
		}

		if (!isExpanded || subfolders.length === 0) return;

		const children = item.createEl("ul", { attr: { role: "group" } });
		for (const subfolder of subfolders) {
			this.renderFolderNode(children, subfolder, currentFolder);
		}
	}

	private createOrderButton(
		container: HTMLElement,
		folder: TFolder,
		action: "move-up" | "move-down",
		icon: string,
		disabled: boolean
	): void {
		const direction = action === "move-up" ? "up" : "down";
		const button = container.createEl("button", {
			cls: "alternative-explorer-icon-button",
			attr: {
				type: "button",
				"data-folder-action": action,
				"data-folder-path": folder.path,
				"aria-label": `Move ${this.folderName(folder)} ${direction}`,
			},
		});
		button.disabled = disabled;
		setIcon(button, icon);
	}

	private renderContent(layout: HTMLElement, folder: TFolder): void {
		const pane = layout.createEl("section", {
			cls: "alternative-explorer-content-pane",
			attr: { "aria-label": "Files" },
		});
		this.renderBreadcrumbs(pane, folder);

		const toolbar = pane.createDiv({ cls: "alternative-explorer-toolbar" });
		const titleGroup = toolbar.createDiv({ cls: "alternative-explorer-title-group" });
		titleGroup.createEl("h2", { text: this.folderName(folder) });

		const files = this.getFiles(folder, this.plugin.settings.recursive);
		titleGroup.createEl("span", {
			text: `${files.length} ${files.length === 1 ? "file" : "files"}`,
		});
		this.renderModeToggle(toolbar);

		if (files.length === 0) {
			pane.createDiv({
				cls: "alternative-explorer-empty",
				text: this.plugin.settings.recursive
					? "No files in this folder or its subfolders."
					: "No files directly in this folder.",
			});
			return;
		}

		const grid = pane.createDiv({ cls: "alternative-explorer-file-grid" });
		for (const file of files) {
			const card = grid.createEl("button", {
				cls: "alternative-explorer-file-card",
				attr: {
					type: "button",
					"data-file-path": file.path,
					title: file.path,
				},
			});
			card.createDiv({ cls: "alternative-explorer-file-title", text: file.basename });
			card.createEl("time", {
				cls: "alternative-explorer-file-date",
				text: moment(file.stat.mtime).format("YYYY-MM-DD HH:mm"),
				attr: { datetime: moment(file.stat.mtime).toISOString() },
			});
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
				breadcrumbs.createSpan({ cls: "alternative-explorer-breadcrumb-separator", text: "/" });
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
			attr: { role: "group", "aria-label": "File listing depth" },
		});
		for (const [recursive, label] of [
			[false, "Direct"],
			[true, "Recursive"],
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

		if (action === "navigate") {
			this.plugin.settings.currentFolder = folder.path;
			this.expandLineage(folder);
		} else if (action === "expand") {
			const expanded = new Set(this.plugin.settings.expandedFolders);
			if (expanded.has(folder.path)) {
				expanded.delete(folder.path);
			} else {
				expanded.add(folder.path);
			}
			this.plugin.settings.expandedFolders = Array.from(expanded);
		} else {
			await this.moveFolder(folder, action === "move-up" ? -1 : 1);
			return;
		}

		await this.plugin.saveSettings();
		this.render();
	}

	private async setRecursive(recursive: boolean): Promise<void> {
		if (this.plugin.settings.recursive === recursive) return;
		this.plugin.settings.recursive = recursive;
		await this.plugin.saveSettings();
		this.render();
	}

	private async moveFolder(folder: TFolder, delta: -1 | 1): Promise<void> {
		const parent = folder.parent ?? this.app.vault.getRoot();
		const order = this.getOrderedSubfolders(parent).map((sibling) => sibling.path);
		this.plugin.settings.folderOrder[parent.path] = moveFolderBy(order, folder.path, delta);
		await this.plugin.saveSettings();
		this.plugin.refreshViews();
	}

	private async moveFolderBeforeTarget(folderPath: string, targetPath: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		const target = this.app.vault.getAbstractFileByPath(targetPath);
		if (!(folder instanceof TFolder) || !(target instanceof TFolder)) return;
		if (folder.parent?.path !== target.parent?.path) return;

		const parent = folder.parent ?? this.app.vault.getRoot();
		const order = this.getOrderedSubfolders(parent).map((sibling) => sibling.path);
		this.plugin.settings.folderOrder[parent.path] = moveFolderBefore(
			order,
			folder.path,
			target.path
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

	private expandLineage(folder: TFolder): void {
		const expanded = new Set(this.plugin.settings.expandedFolders);
		let cursor: TFolder | null = folder;
		while (cursor) {
			expanded.add(cursor.path);
			cursor = cursor.parent;
		}
		this.plugin.settings.expandedFolders = Array.from(expanded);
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

	private getValidDropTarget(target: EventTarget | null): HTMLElement | null {
		const row = (target as HTMLElement | null)?.closest<HTMLElement>(
			".alternative-explorer-tree-row[data-folder-path]"
		);
		if (!row || !this.draggedFolderPath || row.dataset.root === "true") return null;

		const dragged = this.app.vault.getAbstractFileByPath(this.draggedFolderPath);
		return dragged instanceof TFolder && dragged.parent?.path === row.dataset.parentPath ? row : null;
	}

	private clearDropTargets(): void {
		this.contentEl
			.querySelectorAll(".is-drop-target")
			.forEach((element) => element.removeClass("is-drop-target"));
	}

	private finishDrag(): void {
		this.draggedFolderPath = null;
		this.clearDropTargets();
		this.contentEl
			.querySelectorAll(".is-dragging")
			.forEach((element) => element.removeClass("is-dragging"));
	}
}
