// Rudimentary logger implementation
// Use console binds to preserve source locations/backtraces

type LogFunction = (msg: string) => void;

function makeFn(level: keyof Console): LogFunction {
	return console[level].bind(console, "DVDefs %s: %s", level.toUpperCase());
}

export const logError = makeFn("error");
export const logWarn = makeFn("warn");
export const logInfo = makeFn("info");
export const logDebug = makeFn("debug");
export const log = makeFn("log");
