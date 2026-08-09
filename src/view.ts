import { ItemView, TFile, TFolder, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type AlternativeExplorerPlugin from "./main";
import { VIEW_TYPE_ALTERNATIVE_EXPLORER } from "./constants";
import { getBookmarkedFilePaths } from "./bookmarks";
import { mergeFolderOrder, moveFolderRelative } from "./folder-order";
import { groupNotesByRecency } from "./note-groups";

type FolderAction = "drill" | "open-notes" | "back-to-folders";

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
		const container = this.contentEl;
		container.empty();

		const browser = container.createEl("main", { cls: "alternative-explorer-browser" });
		if (this.plugin.settings.pane === "notes") {
			this.renderNotesPane(browser);
		} else {
			this.renderFoldersPane(browser);
		}
	}

	private registerInteractions(): void {
		this.registerDomEvent(this.contentEl, "click", (event) => {
			const element = event.target as HTMLElement;
			const folderControl = element.closest<HTMLButtonElement>("button[data-folder-action]");
			if (folderControl) {
				event.preventDefault();
				const action = folderControl.dataset.folderAction as FolderAction | undefined;
				const path = folderControl.dataset.folderPath;
				if (!action) return;
				if (action === "back-to-folders") {
					void this.backToFolders();
					return;
				}
				if (path) {
					void this.handleFolderAction(path, action);
				}
				return;
			}

			const allNotesControl = element.closest<HTMLButtonElement>("button[data-open-all-notes]");
			if (allNotesControl) {
				event.preventDefault();
				void this.openAllNotes();
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

	private renderFoldersPane(container: HTMLElement): void {
		const currentFolder = this.resolveCurrentFolder();
		this.renderFoldersHeader(container, currentFolder);

		const section = container.createEl("section", {
			cls: "alternative-explorer-section alternative-explorer-folder-section",
			attr: { "aria-label": "Folders" },
		});

		const list = section.createDiv({ cls: "alternative-explorer-folder-list" });

		if (currentFolder.isRoot()) {
			this.renderAllNotesRow(list);
		}

		const folders = this.getOrderedSubfolders(currentFolder);
		if (folders.length === 0 && !currentFolder.isRoot()) {
			const empty = section.createDiv({ cls: "alternative-explorer-empty" });
			const icon = empty.createSpan();
			setIcon(icon, "folder");
			empty.createDiv({ text: "No folders here" });
			empty.createEl("p", { text: "Use Back to return to the parent folder." });
			return;
		}

		for (const child of folders) {
			this.renderFolderRow(list, currentFolder, child);
		}
	}

	private renderFoldersHeader(container: HTMLElement, folder: TFolder): void {
		const header = container.createEl("header", { cls: "alternative-explorer-header" });
		const navigation = header.createDiv({ cls: "alternative-explorer-navigation" });

		if (folder.parent) {
			const backButton = navigation.createEl("button", {
				cls: "alternative-explorer-back-button",
				attr: {
					type: "button",
					"data-folder-action": "drill",
					"data-folder-path": folder.parent.path,
					"aria-label": `Back to ${this.folderName(folder.parent)}`,
				},
			});
			setIcon(backButton, "arrow-left");
		}

		this.renderBreadcrumbs(navigation, folder);

		const heading = header.createDiv({ cls: "alternative-explorer-heading" });
		heading.createEl("h1", { text: this.folderName(folder) });
	}

	private renderAllNotesRow(list: HTMLElement): void {
		const row = list.createDiv({ cls: "alternative-explorer-folder-row is-smart-row" });
		const button = row.createEl("button", {
			cls: "alternative-explorer-folder-button",
			attr: {
				type: "button",
				"data-open-all-notes": "true",
				title: "All notes",
			},
		});
		const icon = button.createSpan({ cls: "alternative-explorer-row-icon" });
		setIcon(icon, "files");
		const copy = button.createSpan({ cls: "alternative-explorer-folder-copy" });
		copy.createSpan({ cls: "alternative-explorer-folder-name", text: "All notes" });
		copy.createSpan({
			cls: "alternative-explorer-folder-meta",
			text: this.allNotesSummary(),
		});
		const arrow = button.createSpan({ cls: "alternative-explorer-row-arrow" });
		setIcon(arrow, "chevron-right");
	}

	private renderFolderRow(list: HTMLElement, parent: TFolder, child: TFolder): void {
		const hasSubfolders = child.children.some((entry) => entry instanceof TFolder);
		const row = list.createDiv({
			cls: "alternative-explorer-folder-row",
			attr: {
				draggable: "true",
				"data-folder-path": child.path,
				"data-parent-path": parent.path,
			},
		});

		const openButton = row.createEl("button", {
			cls: "alternative-explorer-folder-button",
			attr: {
				type: "button",
				"data-folder-action": "open-notes",
				"data-folder-path": child.path,
				title: child.path,
			},
		});
		const icon = openButton.createSpan({ cls: "alternative-explorer-row-icon" });
		setIcon(icon, "folder");
		const copy = openButton.createSpan({ cls: "alternative-explorer-folder-copy" });
		copy.createSpan({ cls: "alternative-explorer-folder-name", text: child.name });
		copy.createSpan({
			cls: "alternative-explorer-folder-meta",
			text: this.folderSummary(child),
		});

		if (hasSubfolders) {
			const drillButton = row.createEl("button", {
				cls: "alternative-explorer-folder-drill",
				attr: {
					type: "button",
					"data-folder-action": "drill",
					"data-folder-path": child.path,
					"aria-label": `Open folders in ${child.name}`,
					title: `Open folders in ${child.name}`,
				},
			});
			setIcon(drillButton, "chevron-right");
		}

		const dragHandle = row.createSpan({
			cls: "alternative-explorer-drag-handle",
			attr: { "aria-hidden": "true" },
		});
		setIcon(dragHandle, "grip-vertical");
	}

	private renderNotesPane(container: HTMLElement): void {
		const title = this.notesTitle();
		this.renderNotesHeader(container, title);

		const files = this.getNotesForScope();
		const pinnedPaths = getBookmarkedFilePaths(this.app);
		const groups = groupNotesByRecency(
			files.map((file) => ({ file, path: file.path, mtime: file.stat.mtime })),
			pinnedPaths
		);

		if (groups.length === 0) {
			const empty = container.createDiv({ cls: "alternative-explorer-empty" });
			const icon = empty.createSpan();
			setIcon(icon, "file-text");
			empty.createDiv({ text: "No notes here yet" });
			empty.createEl("p", {
				text:
					this.plugin.settings.notesScope === "all"
						? "Notes in the vault will appear here."
						: "This folder has no notes yet.",
			});
			return;
		}

		for (const group of groups) {
			const section = container.createEl("section", {
				cls: "alternative-explorer-section alternative-explorer-file-section",
				attr: { "aria-label": group.label },
			});
			const sectionHeader = section.createDiv({ cls: "alternative-explorer-section-header" });
			const label = sectionHeader.createDiv({ cls: "alternative-explorer-section-label" });
			label.createEl("h2", { text: group.label });
			label.createSpan({
				text: String(group.notes.length),
				attr: {
					"aria-label": `${group.notes.length} ${group.notes.length === 1 ? "note" : "notes"}`,
				},
			});

			const list = section.createDiv({ cls: "alternative-explorer-file-list" });
			for (const entry of group.notes) {
				this.renderNoteRow(list, entry.file);
			}
		}
	}

	private renderNotesHeader(container: HTMLElement, title: string): void {
		const header = container.createEl("header", { cls: "alternative-explorer-header" });
		const navigation = header.createDiv({ cls: "alternative-explorer-navigation" });
		const backButton = navigation.createEl("button", {
			cls: "alternative-explorer-back-button",
			attr: {
				type: "button",
				"data-folder-action": "back-to-folders",
				"aria-label": "Back to folders",
			},
		});
		setIcon(backButton, "arrow-left");
		navigation.createSpan({
			cls: "alternative-explorer-pane-label",
			text: "Folders",
		});

		const heading = header.createDiv({ cls: "alternative-explorer-heading" });
		heading.createEl("h1", { text: title });
	}

	private renderNoteRow(list: HTMLElement, file: TFile): void {
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
		if (this.plugin.settings.notesScope === "all" && file.parent && !file.parent.isRoot()) {
			copy.createSpan({
				cls: "alternative-explorer-file-location",
				text: file.parent.path,
			});
		}
		row.createEl("time", {
			cls: "alternative-explorer-file-date",
			text: moment(file.stat.mtime).format("MMM D"),
			attr: {
				datetime: moment(file.stat.mtime).toISOString(),
				title: moment(file.stat.mtime).format("YYYY-MM-DD HH:mm"),
			},
		});
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
				const separator = breadcrumbs.createSpan({
					cls: "alternative-explorer-breadcrumb-separator",
				});
				setIcon(separator, "chevron-right");
			}
			breadcrumbs.createEl("button", {
				text: this.folderName(ancestor),
				attr: {
					type: "button",
					"data-folder-action": "drill",
					"data-folder-path": ancestor.path,
					"aria-current": ancestor.path === folder.path ? "page" : "false",
				},
			});
		});
	}

	private async handleFolderAction(path: string, action: FolderAction): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder)) return;

		if (action === "drill") {
			this.plugin.settings.currentFolder = folder.path;
			this.plugin.settings.pane = "folders";
		} else if (action === "open-notes") {
			this.plugin.settings.pane = "notes";
			this.plugin.settings.notesScope = folder.path;
		}

		await this.plugin.saveSettings();
		this.render();
	}

	private async openAllNotes(): Promise<void> {
		this.plugin.settings.pane = "notes";
		this.plugin.settings.notesScope = "all";
		await this.plugin.saveSettings();
		this.render();
	}

	private async backToFolders(): Promise<void> {
		this.plugin.settings.pane = "folders";
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
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
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

	private getNotesForScope(): TFile[] {
		const scope = this.plugin.settings.notesScope;
		if (scope === "all") {
			return this.app.vault.getFiles();
		}

		const folder = this.app.vault.getAbstractFileByPath(scope);
		if (!(folder instanceof TFolder)) {
			return [];
		}

		return folder.children.filter((child): child is TFile => child instanceof TFile);
	}

	private notesTitle(): string {
		if (this.plugin.settings.notesScope === "all") {
			return "All notes";
		}
		const folder = this.app.vault.getAbstractFileByPath(this.plugin.settings.notesScope);
		if (folder instanceof TFolder) {
			return this.folderName(folder);
		}
		return "Notes";
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

	private allNotesSummary(): string {
		const count = this.app.vault.getFiles().length;
		return `${count} ${count === 1 ? "note" : "notes"}`;
	}

	private getValidDropTarget(target: EventTarget | null): HTMLElement | null {
		const row = (target as HTMLElement | null)?.closest<HTMLElement>(
			".alternative-explorer-folder-row[data-folder-path]"
		);
		if (!row || !this.draggedFolderPath) return null;
		if (row.dataset.folderPath === this.draggedFolderPath) return null;

		const dragged = this.app.vault.getAbstractFileByPath(this.draggedFolderPath);
		return dragged instanceof TFolder && dragged.parent?.path === row.dataset.parentPath
			? row
			: null;
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
