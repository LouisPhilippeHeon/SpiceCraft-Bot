import { ChannelType, Client, Colors, GatewayIntentBits, Guild, PermissionsBitField, Role, TextChannel } from "discord.js";
import * as Models from './models';
import * as Constants from './bot-constants';
import * as Config from './config';
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
}) as Models.ClientWithCommands;

// structuredClone dosen't work in some circumstances
export function deepCloneWithJson(objectToClone: any): any {
	return JSON.parse(JSON.stringify(objectToClone));
}

export async function fetchBotChannel(guild: Guild): Promise<TextChannel> {
	let channel = guild.channels.cache.find(channel => channel.name === Constants.whitelistChannelName) as TextChannel;
	if (channel) return channel;

	return await guild.channels.create({
		name: Constants.whitelistChannelName,
		type: ChannelType.GuildText,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: [PermissionsBitField.Flags.ViewChannel]
			},
			{
				// Highest role of bot
				id: client.guilds.cache.get(Config.guildId).members.cache.get(client.user.id).roles.highest,
				allow: [PermissionsBitField.Flags.ViewChannel]
			}
		],
	});
}

export async function fetchPlayerRole(guild: Guild): Promise<Role> {
	let role = guild.roles.cache.find(role => role.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
	if (role) return role;

	return await guild.roles.create({
		name: Constants.playerRoleName,
		color: Colors.Green,
		reason: 'Le rôle pour les joueurs n\'existait pas, il a été créé.',
	});
}