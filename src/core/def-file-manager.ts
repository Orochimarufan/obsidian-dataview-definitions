import { App, TFile, TFolder } from "obsidian";
import { RadixTree } from "./radix-tree";
import { DEFAULT_DEF_FOLDER } from "src/settings";
import { normaliseWord } from "src/util/editor";
import { logWarn } from "src/util/log";
import { FileParser } from "./file-parser";
import { Definition } from "./model";

let defFileManager: DefManager;

export class DefManager {
	app: App;
	globalDefFiles: TFile[];
	tree: RadixTree<Definition>;

	constructor(app: App) {
		this.app = app;
		this.globalDefFiles = [];
		window.NoteDefinition.definitions.global = this.tree = new RadixTree();
	}

	isDefFile(file: TFile): boolean {
		return file.path.startsWith(this.getGlobalDefFolder())
	}

	reset() {
		this.tree.clear();
		this.globalDefFiles = [];
	}

	loadDefinitions() {
		this.reset();
		this.loadGlobals();
	}

	get(key: string) {
		return this.tree.get(normaliseWord(key));
	}

	has(key: string) {
		return this.tree.has(normaliseWord(key));
	}

	private async loadGlobals() {
		const globalFolder = this.app.vault.getFolderByPath(this.getGlobalDefFolder());
		if (!globalFolder) {
			logWarn("Global definition folder not found, unable to load global definitions");
			return
		}

		// Recursively load files within the global definition folder
		const definitions = await this.parseFolder(globalFolder);
		definitions.forEach(def => this.tree.set(def.key, def));
	}

	private async parseFolder(folder: TFolder): Promise<Definition[]> {
		const definitions: Definition[] = [];
		for (const f of folder.children) {
			if (f instanceof TFolder) {
				const defs = await this.parseFolder(f);
				definitions.push(...defs);
			} else if (f instanceof TFile) {
				const defs = await this.parseFile(f);
				definitions.push(...defs);
			}
		}
		return definitions;
	}

	private async parseFile(file: TFile): Promise<Definition[]> {
		this.globalDefFiles.push(file);
		const parser = new FileParser(this.app, file);
		return parser.parseFile();
	}

	getGlobalDefFolder() {
		return window.NoteDefinition.settings.defFolder || DEFAULT_DEF_FOLDER;
	}
}

export function initDefFileManager(app: App): DefManager {
	defFileManager = new DefManager(app);
	return defFileManager;
}

export function getDefFileManager(): DefManager {
	return defFileManager;
}
