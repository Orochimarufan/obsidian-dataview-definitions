import { App, PluginSettingTab, Setting } from "obsidian";
import DataViewDefinitions from "./main";

export enum PopoverEventSettings {
	Hover = "hover",
	Click = "click"
}

export interface PopoverConfig {
	enableCustomSize: boolean;
	maxWidth: number;
	maxHeight: number;
}

export interface Settings {
	enableInReadingView: boolean;
	definitionSelector: string;
	popoverEvent: PopoverEventSettings;
	popoverConfig: PopoverConfig;
}

export const DEFAULT_SETTINGS: Settings = {
	enableInReadingView: true,
	definitionSelector: '"definitions" or #definition',
	popoverEvent: PopoverEventSettings.Hover,
	popoverConfig: {
		enableCustomSize: false,
		maxWidth: 150,
		maxHeight: 150
	}
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
			.setHeading()
			.setName("Popover Settings");

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

			new Setting(containerEl)
			.setName("Custom popover size")
			.setDesc("Customise the maximum popover size. This is not recommended as it prevents dynamic sizing of the popover based on your viewport.")
			.addToggle(component => {
				component.setValue(this.settings.popoverConfig.enableCustomSize);
				component.onChange(async value => {
					this.settings.popoverConfig.enableCustomSize = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (this.settings.popoverConfig.enableCustomSize) {
			new Setting(containerEl)
				.setName("Popover width (px)")
				.setDesc("Maximum width of the definition popover")
				.addSlider(component => {
					component.setLimits(150, window.innerWidth, 1);
					component.setValue(this.settings.popoverConfig.maxWidth);
					component.setDynamicTooltip()
					component.onChange(async val => {
						this.settings.popoverConfig.maxWidth = val;
						await this.plugin.saveSettings();
					});
				});

			new Setting(containerEl)
				.setName("Popover height (px)")
				.setDesc("Maximum height of the definition popover")
				.addSlider(component => {
					component.setLimits(150, window.innerHeight, 1);
					component.setValue(this.settings.popoverConfig.maxHeight);
					component.setDynamicTooltip();
					component.onChange(async val => {
						this.settings.popoverConfig.maxHeight = val;
						await this.plugin.saveSettings();
					});
				});
		}

	}
}
