import { Editor } from "obsidian";
import { getMarkedPhrases } from "src/editor/decoration";

export function getMarkedWordUnderCursor(editor: Editor) {
	const currWord = getWordByOffset(editor.posToOffset(editor.getCursor()));
	return normaliseWord(currWord);
}

export function normaliseWord(word: string) {
	return word.trimStart().trimEnd().toLowerCase();
}

function getWordByOffset(offset: number): string {
	const markedPhrases = getMarkedPhrases();
	let start = 0;
	let end = markedPhrases.length - 1;

	// Binary search to get marked word at provided position
	while (start <= end) {
		const mid = Math.floor((start + end) / 2);

		const currPhrase = markedPhrases[mid];
		if (offset >= currPhrase.from && offset <= currPhrase.to) {
			return currPhrase.text;
		}
		if (offset < currPhrase.from) {
			end = mid - 1;
		}
		if (offset > currPhrase.to) {
			start = mid + 1;
		}
	}
	return "";
}
