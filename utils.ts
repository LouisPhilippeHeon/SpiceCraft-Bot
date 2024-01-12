import { ChannelType, Colors, Guild, GuildMember, Interaction, InteractionReplyOptions, MessagePayload, PermissionsBitField, Role, TextChannel } from 'discord.js';
import * as Strings from './strings';
import { client, playerRoleName, whitelistChannelName } from './bot-constants';
import { guildId } from './config';

// structuredClone dosen't work in some circumstances
export function deepCloneWithJson(objectToClone: any): any {
	return JSON.parse(JSON.stringify(objectToClone));
}

export async function fetchBotChannel(guild: Guild, createIfNecessary = true): Promise<TextChannel> | null {
	const channel = guild.channels.cache.find(channel => channel.name === whitelistChannelName) as TextChannel;
	if (channel) return channel;

	if (!createIfNecessary) return null;

	return await guild.channels.create({
		name: whitelistChannelName,
		type: ChannelType.GuildText,
		permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: [PermissionsBitField.Flags.ViewChannel]
			},
			{
				// Highest role of bot
				id: client.guilds.cache.get(guildId).members.cache.get(client.user.id).roles.highest,
				allow: [PermissionsBitField.Flags.ViewChannel]
			}
		],
	});
}

export async function fetchPlayerRole(guild: Guild, createIfNecessery = true): Promise<Role> | null {
	const role = guild.roles.cache.find(role => role.name.toLowerCase() === playerRoleName.toLowerCase());
	if (role) return role;

	if (!createIfNecessery) return null;
	return await guild.roles.create({
		name: playerRoleName,
		color: Colors.Green,
		reason: Strings.utils.createdPlayerRole,
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

export async function replyOrFollowUp(message: string | MessagePayload | InteractionReplyOptions, interaction: Interaction) {
	if (!interaction.isRepliable()) return;

	if (interaction.replied || interaction.deferred)
		await interaction.followUp(message);
	else
		await interaction.reply(message);
}

export function formatDate(dateToFormat: Date): string {
	const parts = dateToFormat.toString().split(' ');
	const datePart = parts[0];
	const timePart = parts[1];

	const dateParts = datePart.split('-');
	const year = Number(dateParts[0]);
	const month = Number(dateParts[1]);
	const day = Number(dateParts[2]);

	const timeParts = timePart.split(':');
	const hours = Number(timeParts[0]);
	const minutes = Number(timeParts[1]);

	const date = new Date(year, month - 1, day, hours, minutes);

	const options = {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	} as Intl.DateTimeFormatOptions;

	return date.toLocaleDateString('fr-FR', options);
}