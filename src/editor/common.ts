import { PopoverEventSettings } from "src/settings";

const triggerFunc = 'event.stopPropagation();window.DataViewDefinitions.triggerPopover(this);';

export const DEF_DECORATION_CLS = "def-decoration";

export function getDecorationAttrs(phrase: string): { [key: string]: string } {
	const attributes: { [key: string]: string } = {
		def: phrase,
	}
	const settings = window.DataViewDefinitions.settings;
	if (settings.popoverEvent === PopoverEventSettings.Click) {
		attributes.onclick = triggerFunc;
	} else {
		attributes.onmouseenter = triggerFunc;
	}
	return attributes;
}
