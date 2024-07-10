import { Menu, Plugin } from 'obsidian';
import { logDebug } from './util/log';
import { definitionMarker } from './editor/decoration';
import { Extension } from '@codemirror/state';
import { Definition } from './core/model';
import { DefinitionPopover } from './editor/definition-popover';
import { postProcessor } from './editor/md-postprocessor';
import { DEFAULT_SETTINGS, Settings, SettingsTab } from './settings';
import { getMarkedWordUnderCursor } from './util/editor';
import { FileExplorerDecoration } from './ui/file-explorer';
import { Index } from './core/dataview';

declare global {
	interface Window { DataViewDefinitions: DataViewDefinitions; }
}

export default class DataViewDefinitions extends Plugin {
	index: Index;
	settings: Settings;
	activeEditorExtensions: Extension[] = [];
	popover: DefinitionPopover;
	fileExplorerDeco: FileExplorerDecoration;

	async onload() {
		window.DataViewDefinitions = this;

		logDebug("Loading DV definitions plugin");
	
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.index = new Index(this.app);

		this.popover = new DefinitionPopover(this);
		this.fileExplorerDeco = new FileExplorerDecoration(this.app);

		this.registerCommands();
		this.registerEvents();
		this.registerEditorExtension(this.activeEditorExtensions);

		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(postProcessor);

		this.refreshDefinitions();
	}

	async saveSettings() {
		await this.saveData(window.DataViewDefinitions.settings);
		this.fileExplorerDeco.run();
		this.refreshDefinitions();
	}

	registerCommands() {
		this.addCommand({
			id: "preview-definition",
			name: "Preview definition",
			editorCallback: (editor) => {
				const curWord = getMarkedWordUnderCursor(editor);
				if (!curWord) return;
				const def = this.index.get(curWord);
				if (!def) return;
				this.popover.openAtCursor(def);
			}
		});

		this.addCommand({
			id: "goto-definition",
			name: "Go to definition",
			editorCallback: (editor) => {
				const currWord = getMarkedWordUnderCursor(editor);
				if (!currWord) return;
				const def = this.index.get(currWord);
				if (!def) return;
				this.app.workspace.openLinkText(def.path, '');
			}
		})
	}

	registerEvents() {
		this.registerEvent(this.app.metadataCache.on("dataview:metadata-change" as any, (type: any, file: any, oldPath?: any) => {
			// TODO: more granular
			this.refreshDefinitions();
		}));

		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf) => {
			if (!leaf) return;
			this.registerEditorExts();
		}));

		// Add editor menu option to preview definition
		this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor) => {
			const curWord = getMarkedWordUnderCursor(editor);
			if (!curWord) return;
			const def = this.index.get(curWord);
			if (!def) return;
			this.registerMenuItems(menu, def);
		}));

		// Add file menu options
		/*this.registerEvent(this.app.workspace.on("file-menu", (menu, file, source) => {
			if (file instanceof TFolder) {
				menu.addItem(item => {
					item.setTitle("Set definition folder")
						.setIcon("book-a")
						.onClick(() => {
							const settings = getSettings();
							settings.definitionSelector = file.path;
							this.saveSettings();
						});
				});
			}
		}));*/
	}

	registerMenuItems(menu: Menu, def: Definition) {
		menu.addItem((item) => {
			item.setTitle("Go to definition")
				.setIcon("arrow-left-from-line")
				.onClick(() => {
					this.app.workspace.openLinkText(def.path, '');
				});
		})
	}

	refreshDefinitions() {
		this.index.build(this.settings.definitionSelector);
		this.fileExplorerDeco.refresh(this.settings.definitionSelector);
	}

	registerEditorExts() {
		const currFile = this.app.workspace.getActiveFile();
		if (currFile && this.index.dataview.pagePaths(this.settings.definitionSelector).includes(currFile.path)) {
			// TODO: Editor extension for definition file
			this.setActiveEditorExtensions([]);
		} else {
			this.setActiveEditorExtensions(definitionMarker);
		}
	}

	private setActiveEditorExtensions(...ext: Extension[]) {
		this.activeEditorExtensions.length = 0;
		this.activeEditorExtensions.push(...ext);
		this.app.workspace.updateOptions();
	}

	onunload() {
		logDebug("Unloading DataView definitions plugin");
		this.popover.cleanUp();
	}
}
