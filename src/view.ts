import { ItemView, Menu, Notice, TFile, TFolder, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type AlternativeExplorerPlugin from "./main";
import { VIEW_TYPE_ALTERNATIVE_EXPLORER } from "./constants";
import { getBookmarkedFilePaths, toggleFileBookmark } from "./bookmarks";
import { mergeFolderOrder, moveFolderRelative } from "./folder-order";
import { groupNotesByRecency } from "./note-groups";

type FolderAction = "select" | "toggle" | "back-to-folders";

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

			const recursiveControl = element.closest<HTMLButtonElement>("button[data-recursive]");
			if (recursiveControl) {
				event.preventDefault();
				void this.setRecursive(recursiveControl.dataset.recursive === "true");
				return;
			}

			const fileControl = element.closest<HTMLButtonElement>("button[data-file-path]");
			if (fileControl?.dataset.filePath) {
				event.preventDefault();
				void this.openFile(fileControl.dataset.filePath);
			}
		});

		this.registerDomEvent(this.contentEl, "contextmenu", (event) => {
			const fileControl = (event.target as HTMLElement).closest<HTMLButtonElement>(
				"button[data-file-path]"
			);
			const path = fileControl?.dataset.filePath;
			if (!path) return;

			event.preventDefault();
			this.showNoteContextMenu(event, path);
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
		const root = this.app.vault.getRoot();
		this.renderFoldersHeader(container);

		const section = container.createEl("section", {
			cls: "alternative-explorer-section alternative-explorer-folder-section",
			attr: { "aria-label": "Folders" },
		});

		const list = section.createDiv({ cls: "alternative-explorer-folder-list" });
		this.renderAllNotesRow(list);

		const folders = this.getOrderedSubfolders(root);
		if (folders.length === 0) {
			return;
		}

		for (const child of folders) {
			this.renderFolderBranch(list, root, child, 0);
		}
	}

	private renderFoldersHeader(container: HTMLElement): void {
		const header = container.createEl("header", { cls: "alternative-explorer-header" });
		const heading = header.createDiv({ cls: "alternative-explorer-heading" });
		heading.createEl("h1", { text: "Folders" });
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

	private renderFolderBranch(
		list: HTMLElement,
		parent: TFolder,
		folder: TFolder,
		depth: number
	): void {
		this.renderFolderRow(list, parent, folder, depth);

		if (!this.isExpanded(folder.path)) return;

		for (const child of this.getOrderedSubfolders(folder)) {
			this.renderFolderBranch(list, folder, child, depth + 1);
		}
	}

	private renderFolderRow(
		list: HTMLElement,
		parent: TFolder,
		child: TFolder,
		depth: number
	): void {
		const hasSubfolders = child.children.some((entry) => entry instanceof TFolder);
		const expanded = this.isExpanded(child.path);
		const selected = this.plugin.settings.notesScope === child.path;

		const row = list.createDiv({
			cls: `alternative-explorer-folder-row${selected ? " is-selected" : ""}`,
			attr: {
				draggable: "true",
				"data-folder-path": child.path,
				"data-parent-path": parent.path,
				"data-depth": String(depth),
				style: `--folder-depth: ${depth}`,
			},
		});

		if (hasSubfolders) {
			const toggleButton = row.createEl("button", {
				cls: `alternative-explorer-folder-toggle${expanded ? " is-expanded" : ""}`,
				attr: {
					type: "button",
					"data-folder-action": "toggle",
					"data-folder-path": child.path,
					"aria-expanded": String(expanded),
					"aria-label": expanded ? `Collapse ${child.name}` : `Expand ${child.name}`,
					title: expanded ? `Collapse ${child.name}` : `Expand ${child.name}`,
				},
			});
			setIcon(toggleButton, "chevron-right");
		} else {
			row.createSpan({ cls: "alternative-explorer-folder-toggle-spacer" });
		}

		const openButton = row.createEl("button", {
			cls: "alternative-explorer-folder-button",
			attr: {
				type: "button",
				"data-folder-action": "select",
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
						: this.plugin.settings.recursive
							? "This folder and its subfolders have no notes yet."
							: "Switch to All below to include notes in subfolders.",
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
		const titleGroup = heading.createDiv({ cls: "alternative-explorer-title-group" });
		titleGroup.createEl("h1", { text: title });
		if (this.plugin.settings.notesScope !== "all") {
			this.renderModeToggle(heading);
		}
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
		const parent = file.parent;
		const showLocation =
			(this.plugin.settings.notesScope === "all" || this.plugin.settings.recursive) &&
			parent !== null &&
			!parent.isRoot() &&
			parent.path !== this.plugin.settings.notesScope;
		if (showLocation && parent) {
			copy.createSpan({
				cls: "alternative-explorer-file-location",
				text:
					this.plugin.settings.notesScope === "all"
						? parent.path
						: this.relativeParentPath(this.plugin.settings.notesScope, file),
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

	private async handleFolderAction(path: string, action: FolderAction): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!(folder instanceof TFolder)) return;

		if (action === "toggle") {
			this.toggleExpanded(folder.path);
		} else if (action === "select") {
			this.plugin.settings.pane = "notes";
			this.plugin.settings.notesScope = folder.path;
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

	private showNoteContextMenu(event: MouseEvent, path: string): void {
		const pinned = getBookmarkedFilePaths(this.app).has(path);
		const menu = Menu.forEvent(event);
		menu.addItem((item) => {
			item
				.setTitle(pinned ? "Unpin" : "Pin")
				.setIcon(pinned ? "pin-off" : "pin")
				.onClick(() => {
					const result = toggleFileBookmark(this.app, path);
					if (result === null) {
						new Notice("Enable the core Bookmarks plugin to pin notes.");
						return;
					}
					this.render();
				});
		});
	}

	private isExpanded(path: string): boolean {
		return this.plugin.settings.expandedFolders.includes(path);
	}

	private toggleExpanded(path: string): void {
		const expanded = this.plugin.settings.expandedFolders;
		const index = expanded.indexOf(path);
		if (index >= 0) {
			expanded.splice(index, 1);
		} else {
			expanded.push(path);
		}
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

		return this.getFiles(folder, this.plugin.settings.recursive);
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

	private relativeParentPath(scopePath: string, file: TFile): string {
		const parentPath = file.parent?.path ?? "";
		if (!scopePath || scopePath === "/" || scopePath === "") return parentPath;
		if (parentPath.startsWith(scopePath + "/")) {
			return parentPath.slice(scopePath.length + 1);
		}
		return parentPath;
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
