import { getSettings, PopoverEventSettings } from "src/settings";

const triggerFunc = 'event.stopPropagation();window.NoteDefinition.triggerDefPreview(this);';

export const DEF_DECORATION_CLS = "def-decoration";

export function getDecorationAttrs(phrase: string): { [key: string]: string } {
	const attributes: { [key: string]: string } = {
		def: phrase,
	}
	const settings = getSettings();
	if (settings.popoverEvent === PopoverEventSettings.Click) {
		attributes.onclick = triggerFunc;
	} else {
		attributes.onmouseenter = triggerFunc;
	}
	return attributes;
}
