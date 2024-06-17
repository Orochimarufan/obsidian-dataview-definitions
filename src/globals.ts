import { getDefFileManager } from "./core/def-file-manager";
import { Definition } from "./core/model";
import { RadixTree } from "./core/radix-tree";
import { getDefinitionPopover } from "./editor/definition-popover";
import { Settings } from "./settings";
import { LogLevel } from "./util/log";

export {}

declare global {
	interface Window { NoteDefinition: GlobalVars; }
}

export interface GlobalVars {
	LOG_LEVEL: LogLevel;
	definitions: {
		global: RadixTree<Definition>;
	};
	triggerDefPreview: (el: HTMLElement) => void;
	settings: Settings;
}

// Initialise and inject globals
export function injectGlobals(settings: Settings) {
	window.NoteDefinition = {
		LOG_LEVEL: window.NoteDefinition?.LOG_LEVEL || LogLevel.Error,
		definitions: {
			global: new RadixTree<Definition>(),
		},
		triggerDefPreview: (el: HTMLElement) => {
			const word = el.getAttr('def');
			if (!word) return;

			const def = getDefFileManager().get(word);
			if (!def) return;

			const defPopover = getDefinitionPopover();

			if (el.onmouseenter) {
				const openPopover = setTimeout(() => {
					defPopover.openAtCoords(def, el.getBoundingClientRect());
				}, 200);

				el.onmouseleave = () => {
					clearTimeout(openPopover);
				}
				return;
			}
			defPopover.openAtCoords(def, el.getBoundingClientRect());
		},
		settings,
	}
}
