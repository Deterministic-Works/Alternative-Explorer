import { App, Modal, Setting } from "obsidian";

export class SectionNameModal extends Modal {
	constructor(
		app: App,
		heading: string,
		private readonly defaultValue: string,
		private readonly submitLabel: string,
		private readonly onChoose: (value: string | null) => void
	) {
		super(app);
		this.setTitle(heading);
	}

	onOpen(): void {
		const { contentEl } = this;
		let value = this.defaultValue;

		new Setting(contentEl)
			.setName("Name")
			.addText((text) => {
				text.setValue(this.defaultValue).onChange((next) => {
					value = next;
				});
				text.inputEl.addEventListener("keydown", (event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						this.submit(value);
					}
				});
				window.setTimeout(() => {
					text.inputEl.focus();
					text.inputEl.select();
				}, 0);
			});

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText(this.submitLabel).setCta().onClick(() => this.submit(value))
			)
			.addButton((button) => button.setButtonText("Cancel").onClick(() => this.cancel()));
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private submit(value: string): void {
		this.close();
		this.onChoose(value.trim() || "Untitled");
	}

	private cancel(): void {
		this.close();
		this.onChoose(null);
	}
}
