import { SpiceCraftError } from '../models/error';
import { DiscordAPIError } from 'discord.js';
import { error } from './logger';
import { Errors } from '../strings';

// TODO Use strings.ts
const discordApiCodes = new Map<number, string>();
discordApiCodes.set(50007, 'Impossible d\'envoyer un message à cet utilisateur.');
discordApiCodes.set(50013, 'Permissions manquantes');

export function handleError(e: Error, source: string, defaultMessage?: string): string {
	if (e instanceof SpiceCraftError) return e.message;
	error(e, source);
	if (e instanceof DiscordAPIError) {
		let errorMessage = discordApiCodes.get(Number(e.code));
		if (errorMessage) return errorMessage;
	}
	return (defaultMessage) ? defaultMessage : Errors.genericError;
}