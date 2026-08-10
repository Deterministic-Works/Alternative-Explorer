import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private readonly heading: string,
		private readonly message: string,
		private readonly confirmLabel: string,
		private readonly onConfirm: (confirmed: boolean) => void
	) {
		super(app);
		this.setTitle(heading);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("p", {
			text: this.message,
			cls: "alternative-explorer-confirm-message",
		});

		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText(this.confirmLabel)
					.setWarning()
					.onClick(() => this.finish(true))
			)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => this.finish(false))
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private finish(confirmed: boolean): void {
		this.close();
		this.onConfirm(confirmed);
	}
}
