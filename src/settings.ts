import { App, PluginSettingTab, Setting } from "obsidian";
import DataViewDefinitions from "./main";

export enum PopoverEventSettings {
	Hover = "hover",
	Click = "click"
}

export interface Settings {
	enableInReadingView: boolean;
	definitionSelector: string;
	popoverEvent: PopoverEventSettings;
}

export const DEFAULT_SETTINGS: Settings = {
	enableInReadingView: true,
	definitionSelector: '"definitions" or #definition',
	popoverEvent: PopoverEventSettings.Hover,
}

export class SettingsTab extends PluginSettingTab {
	plugin: DataViewDefinitions;

	constructor(app: App, plugin: DataViewDefinitions) {
		super(app, plugin);
		this.plugin = plugin;
	}

	get settings(): Settings {
		return this.plugin.settings;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable in Reading View")
			.setDesc("Allow defined phrases and definition popovers to be shown in Reading View")
			.addToggle((component) => {
				component.setValue(this.settings.enableInReadingView);
				component.onChange(async (val) => {
					this.settings.enableInReadingView = val;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName("Definitions DataView Selector")
			.setDesc("Files matching this selector will be registered as definitions")
			.addText((component) => {
				component.setValue(this.settings.definitionSelector);
				component.setPlaceholder(DEFAULT_SETTINGS.definitionSelector);
				component.onChange(async (val) => {
					this.settings.definitionSelector = val;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName("Definition popover display event")
			.setDesc("Choose the trigger event for displaying the definition popover")
			.addDropdown((component) => {
				component.addOption(PopoverEventSettings.Hover, "Hover");
				component.addOption(PopoverEventSettings.Click, "Click");
				component.setValue(this.settings.popoverEvent);
				component.onChange(async value => {
					if (value === PopoverEventSettings.Hover || value === PopoverEventSettings.Click) {
						this.settings.popoverEvent = value;
					}
					await this.plugin.saveSettings();
				});
			});
	}
}
