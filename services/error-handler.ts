import { SpiceCraftError } from '../models/error';
import { DiscordAPIError, Interaction } from 'discord.js';
import { error } from './logger';
import { Errors } from '../strings';
import { replyOrFollowUp } from '../utils';

// TODO Use strings.ts
const discordApiCodes = new Map<number, string>();
discordApiCodes.set(50007, 'Impossible d\'envoyer un message à cet utilisateur.');
discordApiCodes.set(50013, 'Permissions manquantes');

export async function handleError(e: Error, source: string, interaction: Interaction, defaultMessage?: string, deleteInteraction = false) {
	error(e, source);

	const message = getUserFriendlyErrorMessage(e, defaultMessage);
	await replyOrFollowUp({ content: message, ephemeral: true }, interaction);

	if (deleteInteraction && interaction.isMessageComponent())
		await interaction.message.delete();
}

export function getUserFriendlyErrorMessage(e: Error, defaultMessage?: string): string {
	if (e instanceof SpiceCraftError)
		return e.message;
	if (e instanceof DiscordAPIError) {
		const errorMessage = discordApiCodes.get(Number(e.code));
		if (errorMessage) return errorMessage;
	}
	return (defaultMessage) ? defaultMessage : Errors.genericError;
}