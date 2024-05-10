export class SpiceCraftError extends Error {
	// TODO Add an optionnal parameter for a user-friendly message, to avoid doing if e.message = 'x' interaction.reply('y')
	// TODO Add an optionnal parameter for the stack in constructor, removing the need to log the error when creating one (log the stack in error handler if it is present)
	constructor(message: string) {
		super(message)
	}
}