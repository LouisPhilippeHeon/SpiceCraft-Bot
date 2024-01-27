import fs = require('node:fs');

enum Colors {
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
	addToFile(formatLog(message, 'INFO'));
}

export function warn(message: string) {
	logger.warn(formatConsole(message));
	addToFile(formatLog(message, 'WARN'));
}

export function error(message: string) {
	logger.error(formatConsole(message));
	addToFile(formatLog(message, 'ERROR'));
}

function formatConsole(message: string): string {
	return `[${new Date().toLocaleString('FR', {dateStyle: 'short', timeStyle: 'short'})}] ${message}`;
}

function formatLog(message: string, type: string): string {
	return `[${type}] ${new Date().toLocaleString('FR', {dateStyle: 'short', timeStyle: 'short'})} ${message}`;
}

function addToFile(message: string) {
	const filePath = './logs.log';
	
	try {
		// Create file if it does not exist
		fs.closeSync(fs.openSync(filePath, 'a'));
		fs.appendFileSync(filePath, `${message}\n`);
	}
	catch (e) {
		logger.error(message);
	}
}