import { App, Modal, Setting } from "obsidian";
import type {
	SmartFolder,
	SmartFolderField,
	SmartFolderMatch,
	SmartFolderOperator,
	SmartFolderRule,
} from "./constants";
import {
	RELATIVE_DATE_DAY_LABELS,
	RELATIVE_DATE_DAY_VALUES,
	RELATIVE_DATE_RANGE_LABELS,
	RELATIVE_DATE_RANGE_VALUES,
	createSmartFolder,
	createSmartFolderRule,
	formatLastDaysValue,
	parseLastDaysCount,
} from "./smart-folders";

const FIELD_OPTIONS: { value: string; label: string }[] = [
	{ value: "tags", label: "Tags" },
	{ value: "name", label: "Name" },
	{ value: "path", label: "Path" },
	{ value: "ctime", label: "Created" },
	{ value: "mtime", label: "Modified" },
	{ value: "pinned", label: "Pinned" },
	{ value: "frontmatter", label: "Frontmatter property" },
];

const OPERATOR_OPTIONS: { value: SmartFolderOperator; label: string }[] = [
	{ value: "equals", label: "equals" },
	{ value: "not-equals", label: "does not equal" },
	{ value: "contains", label: "contains" },
	{ value: "not-contains", label: "does not contain" },
	{ value: "starts-with", label: "starts with" },
	{ value: "ends-with", label: "ends with" },
	{ value: "exists", label: "exists" },
	{ value: "not-exists", label: "does not exist" },
	{ value: "before", label: "before" },
	{ value: "after", label: "after" },
	{ value: "on", label: "on" },
	{ value: "within", label: "within" },
];

const PINNED_OPERATOR_OPTIONS: { value: SmartFolderOperator; label: string }[] = [
	{ value: "equals", label: "is" },
	{ value: "not-equals", label: "is not" },
];

const CUSTOM_DATE_VALUE = "__custom__";

function isDateField(field: SmartFolderField): boolean {
	return field === "ctime" || field === "mtime";
}

function isPinnedField(field: SmartFolderField): boolean {
	return field === "pinned";
}

function operatorsForField(field: SmartFolderField): SmartFolderOperator[] {
	if (isDateField(field)) {
		return ["within", "on", "before", "after", "exists", "not-exists"];
	}
	if (isPinnedField(field)) {
		return ["equals", "not-equals"];
	}
	return [
		"equals",
		"not-equals",
		"contains",
		"not-contains",
		"starts-with",
		"ends-with",
		"exists",
		"not-exists",
	];
}

function operatorLabel(field: SmartFolderField, operator: SmartFolderOperator): string {
	if (isPinnedField(field)) {
		const pinned = PINNED_OPERATOR_OPTIONS.find((option) => option.value === operator);
		if (pinned) return pinned.label;
	}
	return OPERATOR_OPTIONS.find((option) => option.value === operator)?.label ?? operator;
}

function fieldSelectValue(field: SmartFolderField): string {
	return field.startsWith("frontmatter:") ? "frontmatter" : field;
}

function frontmatterKeyFromField(field: SmartFolderField): string {
	return field.startsWith("frontmatter:") ? field.slice("frontmatter:".length) : "";
}

function toField(selectValue: string, frontmatterKey: string): SmartFolderField {
	if (selectValue === "frontmatter") {
		const key = frontmatterKey.trim() || "property";
		return `frontmatter:${key}`;
	}
	return selectValue as SmartFolderField;
}

function isRelativePreset(value: string, operator: SmartFolderOperator): boolean {
	if (operator === "within") {
		return (RELATIVE_DATE_RANGE_VALUES as readonly string[]).includes(value);
	}
	return (RELATIVE_DATE_DAY_VALUES as readonly string[]).includes(value);
}

function defaultDateValue(operator: SmartFolderOperator): string {
	return operator === "within" ? "last-7-days" : "today";
}

export class SmartFolderModal extends Modal {
	private name: string;
	private match: SmartFolderMatch;
	private rules: SmartFolderRule[];
	private customDateRuleIds = new Set<string>();
	private focusCustomDateRuleId: string | null = null;
	private didFocusName = false;

	constructor(
		app: App,
		heading: string,
		private readonly initial: SmartFolder | null,
		private readonly submitLabel: string,
		private readonly onSubmit: (folder: SmartFolder | null) => void
	) {
		super(app);
		this.setTitle(heading);
		this.name = initial?.name ?? "New smart folder";
		this.match = initial?.match ?? "all";
		this.rules = (initial?.rules ?? []).map((rule) => ({ ...rule }));
		if (this.rules.length === 0) {
			this.rules.push(createSmartFolderRule());
		}
		for (const rule of this.rules) {
			if (!isDateField(rule.field) || !rule.value) continue;
			const presets =
				rule.operator === "within"
					? (RELATIVE_DATE_RANGE_VALUES as readonly string[])
					: (RELATIVE_DATE_DAY_VALUES as readonly string[]);
			if (presets.includes(rule.value)) continue;
			if (
				/^\d{4}-\d{2}-\d{2}$/.test(rule.value) ||
				(rule.operator === "within" && parseLastDaysCount(rule.value) !== null)
			) {
				this.customDateRuleIds.add(rule.id);
			}
		}
	}

	onOpen(): void {
		this.renderForm();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderForm(): void {
		const { contentEl } = this;
		contentEl.empty();

		new Setting(contentEl).setName("Name").addText((text) => {
			text.setValue(this.name).onChange((value) => {
				this.name = value;
			});
			text.inputEl.addEventListener("keydown", (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					this.submit();
				}
			});
			if (!this.didFocusName) {
				this.didFocusName = true;
				window.setTimeout(() => {
					text.inputEl.focus();
					text.inputEl.select();
				}, 0);
			}
		});

		new Setting(contentEl).setName("Match").addDropdown((dropdown) => {
			dropdown
				.addOption("all", "All rules (AND)")
				.addOption("any", "Any rule (OR)")
				.setValue(this.match)
				.onChange((value) => {
					this.match = value === "any" ? "any" : "all";
				});
		});

		contentEl.createEl("h3", { text: "Rules", cls: "alternative-explorer-smart-rules-heading" });

		for (let index = 0; index < this.rules.length; index++) {
			this.renderRule(contentEl, index);
		}

		new Setting(contentEl).addButton((button) =>
			button.setButtonText("Add rule").onClick(() => {
				this.rules.push(createSmartFolderRule());
				this.renderForm();
			})
		);

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText(this.submitLabel).setCta().onClick(() => this.submit())
			)
			.addButton((button) => button.setButtonText("Cancel").onClick(() => this.cancel()));
	}

	private renderRule(container: HTMLElement, index: number): void {
		const rule = this.rules[index];
		if (!rule) return;

		const allowedOperators = operatorsForField(rule.field);
		if (!allowedOperators.includes(rule.operator)) {
			rule.operator = allowedOperators[0] ?? "equals";
		}

		const setting = new Setting(container).setClass("alternative-explorer-smart-rule");

		setting.addDropdown((dropdown) => {
			for (const option of FIELD_OPTIONS) {
				dropdown.addOption(option.value, option.label);
			}
			dropdown.setValue(fieldSelectValue(rule.field)).onChange((value) => {
				const key = frontmatterKeyFromField(rule.field);
				rule.field = toField(value, key);
				const nextOperators = operatorsForField(rule.field);
				if (!nextOperators.includes(rule.operator)) {
					rule.operator = nextOperators[0] ?? "equals";
				}
				if (isPinnedField(rule.field)) {
					rule.value = rule.value === "false" ? "false" : "true";
				} else if (isDateField(rule.field)) {
					if (
						rule.operator !== "exists" &&
						rule.operator !== "not-exists" &&
						!this.customDateRuleIds.has(rule.id) &&
						!isRelativePreset(rule.value, rule.operator) &&
						!/^\d{4}-\d{2}-\d{2}$/.test(rule.value)
					) {
						rule.value = defaultDateValue(rule.operator);
					}
				} else {
					this.customDateRuleIds.delete(rule.id);
				}
				this.renderForm();
			});
		});

		if (fieldSelectValue(rule.field) === "frontmatter") {
			setting.addText((text) => {
				text.setPlaceholder("property").setValue(frontmatterKeyFromField(rule.field));
				text.inputEl.addClass("alternative-explorer-smart-frontmatter-key");
				text.onChange((value) => {
					rule.field = toField("frontmatter", value);
				});
			});
		}

		setting.addDropdown((dropdown) => {
			for (const option of OPERATOR_OPTIONS) {
				if (!allowedOperators.includes(option.value)) continue;
				dropdown.addOption(option.value, operatorLabel(rule.field, option.value));
			}
			dropdown.setValue(rule.operator).onChange((value) => {
				rule.operator = value as SmartFolderOperator;
				if (
					isDateField(rule.field) &&
					rule.operator !== "exists" &&
					rule.operator !== "not-exists"
				) {
					const keepAbsolute = /^\d{4}-\d{2}-\d{2}$/.test(rule.value);
					if (!keepAbsolute && !isRelativePreset(rule.value, rule.operator)) {
						rule.value = defaultDateValue(rule.operator);
					}
				}
				if (isPinnedField(rule.field) && rule.value !== "true" && rule.value !== "false") {
					rule.value = "true";
				}
				this.renderForm();
			});
		});

		if (rule.operator !== "exists" && rule.operator !== "not-exists") {
			if (isPinnedField(rule.field)) {
				if (rule.value !== "true" && rule.value !== "false") {
					rule.value = "true";
				}
				setting.addDropdown((dropdown) => {
					dropdown
						.addOption("true", "Pinned")
						.addOption("false", "Not pinned")
						.setValue(rule.value)
						.onChange((value) => {
							rule.value = value === "false" ? "false" : "true";
						});
				});
			} else if (isDateField(rule.field)) {
				this.renderDateValueControls(setting, rule);
			} else {
				setting.addText((text) => {
					text.setPlaceholder("Value").setValue(rule.value).onChange((value) => {
						rule.value = value;
					});
				});
			}
		}

		setting.addExtraButton((button) => {
			button
				.setIcon("trash")
				.setTooltip("Remove rule")
				.setDisabled(this.rules.length <= 1)
				.onClick(() => {
					if (this.rules.length <= 1) return;
					this.rules.splice(index, 1);
					this.renderForm();
				});
		});
	}

	private renderDateValueControls(setting: Setting, rule: SmartFolderRule): void {
		const presets =
			rule.operator === "within"
				? (RELATIVE_DATE_RANGE_VALUES as readonly string[])
				: (RELATIVE_DATE_DAY_VALUES as readonly string[]);
		const usingCustom =
			this.customDateRuleIds.has(rule.id) ||
			(rule.value.length > 0 && !presets.includes(rule.value));

		if (!usingCustom && !rule.value) {
			rule.value = defaultDateValue(rule.operator);
		}
		if (usingCustom) {
			this.customDateRuleIds.add(rule.id);
		}

		setting.addDropdown((dropdown) => {
			if (rule.operator === "within") {
				for (const value of RELATIVE_DATE_RANGE_VALUES) {
					dropdown.addOption(value, RELATIVE_DATE_RANGE_LABELS[value]);
				}
			} else {
				for (const value of RELATIVE_DATE_DAY_VALUES) {
					dropdown.addOption(value, RELATIVE_DATE_DAY_LABELS[value]);
				}
			}
			dropdown.addOption(
				CUSTOM_DATE_VALUE,
				rule.operator === "within" ? "Custom days…" : "Custom date…"
			);
			dropdown.setValue(usingCustom ? CUSTOM_DATE_VALUE : rule.value);
			dropdown.onChange((value) => {
				if (value === CUSTOM_DATE_VALUE) {
					this.customDateRuleIds.add(rule.id);
					this.focusCustomDateRuleId = rule.id;
					if (presets.includes(rule.value)) {
						rule.value = rule.operator === "within" ? formatLastDaysValue(14) : "";
					}
				} else {
					this.customDateRuleIds.delete(rule.id);
					this.focusCustomDateRuleId = null;
					rule.value = value;
				}
				this.renderForm();
			});
		});

		if (usingCustom) {
			if (rule.operator === "within") {
				const days = parseLastDaysCount(rule.value) ?? 14;
				if (parseLastDaysCount(rule.value) === null) {
					rule.value = formatLastDaysValue(days);
				}
				setting.addText((text) => {
					text.setPlaceholder("Days").setValue(String(days)).onChange((value) => {
						const parsed = Number.parseInt(value.trim(), 10);
						if (Number.isInteger(parsed) && parsed > 0) {
							rule.value = formatLastDaysValue(parsed);
						} else {
							rule.value = value.trim();
						}
					});
					text.inputEl.type = "number";
					text.inputEl.min = "1";
					text.inputEl.step = "1";
					text.inputEl.addClass("alternative-explorer-smart-custom-days");
					text.inputEl.setAttribute("aria-label", "Last N days");
					text.inputEl.title = "Last N days";
					text.inputEl.addEventListener("keydown", (event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							this.submit();
						}
					});
					if (this.focusCustomDateRuleId === rule.id) {
						this.focusCustomDateRuleId = null;
						window.setTimeout(() => {
							text.inputEl.focus();
							text.inputEl.select();
						}, 0);
					}
				});
			} else {
				setting.addText((text) => {
					text
						.setPlaceholder("YYYY-MM-DD")
						.setValue(/^\d{4}-\d{2}-\d{2}$/.test(rule.value) ? rule.value : "")
						.onChange((value) => {
							rule.value = value.trim();
						});
					text.inputEl.addClass("alternative-explorer-smart-custom-date");
					text.inputEl.addEventListener("keydown", (event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							this.submit();
						}
					});
					if (this.focusCustomDateRuleId === rule.id) {
						this.focusCustomDateRuleId = null;
						window.setTimeout(() => {
							text.inputEl.focus();
							text.inputEl.select();
						}, 0);
					}
				});
			}
		}
	}

	private submit(): void {
		const normalizedRules = this.rules.map((rule) => {
			let value = rule.value.trim();
			if (isDateField(rule.field) && this.customDateRuleIds.has(rule.id)) {
				value = value === CUSTOM_DATE_VALUE ? "" : value;
				if (rule.operator === "within") {
					const days = parseLastDaysCount(value);
					value = days !== null ? formatLastDaysValue(days) : value;
				}
			}
			if (rule.field.startsWith("frontmatter:")) {
				const key = rule.field.slice("frontmatter:".length).trim() || "property";
				return {
					...rule,
					field: `frontmatter:${key}` as SmartFolderField,
					value,
				};
			}
			return { ...rule, value };
		});

		const folder = createSmartFolder(this.name, {
			id: this.initial?.id,
			match: this.match,
			rules: normalizedRules,
		});
		this.close();
		this.onSubmit(folder);
	}

	private cancel(): void {
		this.close();
		this.onSubmit(null);
	}
}
