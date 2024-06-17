import { Index } from "src/core/dataview.js";
import { Definition } from "src/core/model.js";

// Information of phrase that can be used to add decorations within the editor
export interface PhraseInfo {
	from: number;
	to: number;
	text: string;
	def: Definition;
}

export class LineScanner {
	private cnLangRegex = /\p{Script=Han}/u;
	private terminatingCharRegex = /[!@#$%^&*()+={}[\]:;"'<>,.?/|\\\r\n\s （）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､\u3000、〃〈〉《》「」『』【】\u3014\u3015〖〗〘〙〚〛〜〝〞〟—\u2018\u2019\u201b“”„‟…‧\ufe4f﹑﹔·。]/u;
	private index: Index;

	constructor() {
		this.index = window.DataViewDefinitions.index;
	}

	scanLine(line: string, offset?: number): PhraseInfo[] {
		const phraseInfos: PhraseInfo[] = [];
		const llc = line.toLowerCase();

		for (let i = 0; i < line.length; i++) {
			if (this.isValidStart(line, i)) {
				// TODO: better case folding
				const [len, def] = this.index.find(llc.slice(i));
				if (def !== undefined) {
					if (this.isValidEnd(line, i+len-1)) {
						phraseInfos.push({
							text: line.slice(i, i+len),
							def,
							from: (offset ?? 0) + i,
							to: (offset ?? 0) + i + len,
						});
						i += len;
					}
				}
			}
		}
		return phraseInfos;
	}

	private isValidEnd(line: string, ptr: number): boolean {
		const c = line.charAt(ptr).toLowerCase();
		if (this.isNonSpacedLanguage(c)) {
			return true;
		}
		// If EOL, then it is a valid end
		if (ptr === line.length - 1) {
			return true;
		}
		// Check if next character is a terminating character
		return this.terminatingCharRegex.test(line.charAt(ptr+1));
	}

	// Check if this character is a valid start of a word depending on the context
	private isValidStart(line: string, ptr: number): boolean {
		const c = line.charAt(ptr).toLowerCase();
		if (c == " ") {
			return false;
		}
		if (ptr === 0 || this.isNonSpacedLanguage(c)) {
			return true;
		}
		// Check if previous character is a terminating character
		return this.terminatingCharRegex.test(line.charAt(ptr-1))
	}

	private isNonSpacedLanguage(c: string): boolean {
		return this.cnLangRegex.test(c);
	}
}

