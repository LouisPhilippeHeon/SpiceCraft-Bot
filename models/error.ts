export class SpiceCraftError extends Error {
	type: number;

	constructor(message: string, type: number, stack?: string) {
		super(message);
		this.stack = stack;
		this.type = type;
	}
}

export const enum ErrorType {
	discordApi,
	mojangApi,
	database,
	rcon
}