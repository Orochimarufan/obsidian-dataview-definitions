import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginSpec,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";

import { logDebug } from "src/util/log.js";
import { LineScanner, PhraseInfo } from "./definition-search.js";
import { Definition } from "src/core/model.js";
import { PopoverEventSettings } from "src/settings.js";

export const DEF_DECORATION_CLS = "def-decoration";

// TODO: remove global
let markedPhrases: PhraseInfo[] = [];

export function getMarkedPhrases(): PhraseInfo[] {
	return markedPhrases;
}

export function createInlineElement({text, def}: {text: string, def: Definition}): HTMLElement {
	// TODO: move to context to avoid globals
	const el = document.createElement('span');
	el.className = DEF_DECORATION_CLS;
	if (def.ruby !== undefined) {
		const ruby = el.createEl('ruby');
		ruby.appendText(text);
		ruby.createEl('rt', {text: def.ruby});
	} else {
		el.appendText(text);
	}
	const settings = window.DataViewDefinitions.settings;
	el.addEventListener((settings.popoverEvent === PopoverEventSettings.Hover) ? 'mouseenter' : 'click', (e) => {
		const openPopover = setTimeout(() => {
			window.DataViewDefinitions.popover.openAtCoords(def, el.getBoundingClientRect());
		}, 200);

		el.onmouseleave = () => clearTimeout(openPopover);
	});
	return el;
}

class DefinitionWidget extends WidgetType {
	text: string;
	def: Definition;

	constructor(text: string, def: Definition) {
		super();
		this.text = text;
		this.def = def;
	}

	toDOM(view: EditorView): HTMLElement {
		return createInlineElement(this);
	}
}

// View plugin to mark definitions
export class DefinitionMarker implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged || update.focusChanged) {
			const start = performance.now();
			this.decorations = this.buildDecorations(update.view);
			const end = performance.now();
			logDebug(`Marked definitions in ${end-start}ms`)
			return
		}
	}

	destroy() {}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const phraseInfos: PhraseInfo[] = [];

		for (const { from, to } of view.visibleRanges) {
			const text = view.state.sliceDoc(from, to);
			phraseInfos.push(...this.scanText(text, from));
		}

		phraseInfos.forEach(wordPos => {
			builder.add(wordPos.from, wordPos.to, Decoration.widget({widget: new DefinitionWidget(wordPos.text, wordPos.def)}))
		});
		markedPhrases = phraseInfos;

		return builder.finish();
	}

	// Scan text and return phrases and their positions that require decoration
	private scanText(text: string, offset: number): PhraseInfo[] {
		const phraseInfos: PhraseInfo[] = [];
		const lines = text.split('\n');
		let internalOffset = offset;
		const lineScanner = new LineScanner();

		lines.forEach(line => {
			phraseInfos.push(...lineScanner.scanLine(line, internalOffset));
			// Additional 1 char for \n char
			internalOffset += line.length + 1;
		});

		return phraseInfos;
	}
}

const pluginSpec: PluginSpec<DefinitionMarker> = {
	decorations: (value: DefinitionMarker) => value.decorations,
};

export const definitionMarker = ViewPlugin.fromClass(
	DefinitionMarker,
	pluginSpec
);

