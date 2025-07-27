import fs = require('node:fs');

const enum Colors {
	info = '\x1b[36m%s\x1b[0m',
	warn = '\x1b[33m%s\x1b[0m',
	error = '\x1b[31m%s\x1b[0m'
}

const logger = class {
	static info(message: string) { console.info(Colors.info, message) }
	static warn(message: string) { console.warn(Colors.warn, message) }
	static error(message: string) { console.error(Colors.error, message) }
}

export function info(message: string) {
	logger.info(formatConsole(message));
	addToLogFile(formatLog(message, 'INFO'));
}

export function warn(message: string) {
	logger.warn(formatConsole(message));
	addToLogFile(formatLog(message, 'WARN'));
}

export function error(error: string | Error, code: string) {
	const message = error instanceof Error ? error.stack : error;
	logger.error(formatConsole(message, code));
	addToLogFile(formatLog(message, 'ERROR', code));
}

function formatConsole(message: string, code?: string): string {
	return code ? `[${getFormatedDate()}] [${code}] ${message}` : `[${getFormatedDate()}] ${message}`;
}

function formatLog(message: string, type: string, code?: string): string {
	return code ? `[${type} ${code}] [${getFormatedDate()}] ${message}` : `[${type}] [${getFormatedDate()}] ${message}`;
}

function addToLogFile(message: string) {
	const filePath = './logs.log';
	
	try {
		// Create file if it does not exist
		fs.closeSync(fs.openSync(filePath, 'a'));
		fs.appendFileSync(filePath, `${message}\n`);
	} catch {
		logger.error(message);
	}
}

function getFormatedDate(): string {
	return new Date().toLocaleString('FR', { dateStyle: 'short', timeStyle: 'short' });
}