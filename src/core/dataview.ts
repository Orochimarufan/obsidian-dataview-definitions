import { App } from 'obsidian';
import { getAPI, DataviewApi } from 'obsidian-dataview';

import { Definition, DataViewPage } from './model.js';
import { RadixTree } from './radix-tree.js';
import { Settings } from '../settings.js';

export class Index {
    app: App;
    dataview: DataviewApi;
    tree: RadixTree<DataViewPage>;
    settings: Settings;

    constructor(app: App) {
        this.app = app;
        this.dataview = getAPI(app);
        this.tree = new RadixTree();
    }

    build(selector: string, clear=true) {
        if (clear)
            this.tree.clear();
        for (const page of this.dataview.pages(selector)) {
            const lemma = page.lemma ?? page.file.name;
            this.tree.set(lemma.toLowerCase(), page);
            for (const alias of (page.aliases ?? [])) {
                this.tree.set(alias.toLowerCase(), page);
            }
        }
    }

    get(key: string): Definition|undefined {
        const page = this.tree.get(key);
        return page !== undefined ? new Definition(page) : undefined;
    }

    find(key: string): [number, Definition|undefined] {
        const match = this.tree.match(key)?.proper;
        if (match)
            return [match.key_length, new Definition(match.value)];
        else
            return [0, undefined];
    }
}
