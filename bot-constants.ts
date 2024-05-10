import { ClientWithCommands } from './models/client-with-commands';
import { Client, GatewayIntentBits } from 'discord.js';

export const timeoutUserInput = 240000;
export const mojangApiUrl = 'https://api.mojang.com';

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences
	]
}) as ClientWithCommands;

export const enum inscriptionStatus {
	awaitingApproval = 0,
	approved = 1,
	rejected = 2
}