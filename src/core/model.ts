import { Literal } from "obsidian-dataview";

export type DataViewPage = Record<string, Literal>

export class Definition {
    page: DataViewPage;

    constructor(page: DataViewPage) {
        this.page = page;
    }

    get word(): string {
        return this.page.lemma ?? this.page.file.name;
    }

    get aliases(): string[] {
        return this.page.aliases ?? [];
    }

    get definition(): string {
        return this.page.definition ?? this.page.translation ?? "";
    }

    get path(): string {
        return this.page.file.path;
    }
}