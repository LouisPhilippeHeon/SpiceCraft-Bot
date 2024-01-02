import { ChannelType, Client, Colors, GatewayIntentBits, Guild, GuildMember, PermissionsBitField, Role, TextChannel } from "discord.js";
import * as Models from './models';
import * as Constants from './bot-constants';
import * as Config from './config';
import * as Strings from './strings';

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

// TODO add parameter createIfNecessary
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

export async function fetchPlayerRole(guild: Guild, createIfNecessery = true): Promise<Role> {
	let role = guild.roles.cache.find(role => role.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
	if (role) return role;

	if (!createIfNecessery) return null;
	return await guild.roles.create({
		name: Constants.playerRoleName,
		color: Colors.Green,
		reason: 'Le rôle pour les joueurs n\'existait pas, il a été créé.',
	});
}

export async function addPlayerRole(member: GuildMember) {
	const role = await fetchPlayerRole(member.guild);
	await member.roles.add(role);
}

export async function removePlayerRole(member: GuildMember) {
	const role = await fetchPlayerRole(member.guild);
	await member.roles.remove(role);
}

export async function fetchGuildMember(guild: Guild, id: string): Promise<GuildMember> {
	return await guild.members.fetch(id).catch(() => {
		throw Error(Strings.errors.noDiscordUserWithThisUuid);
	});
}

export function formatDate(dateToFormat: Date): string {
	let parts = dateToFormat.toString().split(" ");
	let datePart = parts[0];
	let timePart = parts[1];

	let dateParts = datePart.split("-");
	let year = Number(dateParts[0]);
	let month = Number(dateParts[1]);
	let day = Number(dateParts[2]);

	let timeParts = timePart.split(":");
	let hours = Number(timeParts[0]);
	let minutes = Number(timeParts[1]);

	let date = new Date(year, month - 1, day, hours, minutes);

	let options = {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	} as Intl.DateTimeFormatOptions;

	return date.toLocaleDateString('fr-FR', options);
}