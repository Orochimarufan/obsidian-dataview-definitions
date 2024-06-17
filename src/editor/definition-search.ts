import { getDefFileManager } from "src/core/def-file-manager";

// Information of phrase that can be used to add decorations within the editor
export interface PhraseInfo {
	from: number;
	to: number;
	phrase: string;
}

export class LineScanner {
	private cnLangRegex = /\p{Script=Han}/u;
	private terminatingCharRegex = /[!@#$%^&*()+={}[\]:;"'<>,.?/|\\\r\n\s （）＊＋，－／：；＜＝＞＠［＼］＾＿｀｛｜｝～｟｠｢｣､\u3000、〃〈〉《》「」『』【】\u3014\u3015〖〗〘〙〚〛〜〝〞〟—\u2018\u2019\u201b“”„‟…‧\ufe4f﹑﹔·。]/u;


	scanLine(line: string, offset?: number): PhraseInfo[] {
		const defManager = getDefFileManager();
		const phraseInfos: PhraseInfo[] = [];
		line = line.toLowerCase();

		for (let i = 0; i < line.length; i++) {
			if (this.isValidStart(line, i)) {
				const match = defManager.tree.match(line.slice(i))?.proper;
				if (match) {
					const phrase = match.key;
					if (this.isValidEnd(line, i+phrase.length-1)) {
						phraseInfos.push({
							phrase: phrase,
							from: (offset ?? 0) + i,
							to: (offset ?? 0) + i + phrase.length,
						});
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

