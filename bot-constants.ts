import { Client, GatewayIntentBits } from 'discord.js';
import { ClientWithCommands } from './models';

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