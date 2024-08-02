import { client } from './bot-constants';
import { playerRoleName, whitelistChannelName } from './config';
import { ChannelType, Colors, Guild, GuildMember, Interaction, InteractionReplyOptions, MessagePayload, PermissionsBitField, Role, TextChannel } from 'discord.js';
import { ErrorType, SpiceCraftError } from './models/error';
import { error, warn } from './services/logger';
import { Errors, Logs, Utils } from './strings';

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
				id: client.guilds.cache.get(guild.id).members.me.roles.highest,
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
		reason: Utils.createdPlayerRole,
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
	return await guild.members.fetch(id).catch((e) => {
		throw new SpiceCraftError(Errors.discord.noDiscordUserWithThisUuid, ErrorType.discordApi, e.stack);
	});
}

export async function replyOrFollowUp(message: string | MessagePayload | InteractionReplyOptions, interaction: Interaction) {
	if (!interaction.isRepliable()) {
		warn(template(Logs.interactionIsNotRepliable, {interaction: interaction.toJSON()}));
		return;
	}

	try {
		const interactionRepliedOrDeferred = interaction.replied || interaction.deferred;
		interactionRepliedOrDeferred
			? await interaction.followUp(message)
			: await interaction.reply(message);
	}
	catch (e) {
		error(e, 'UTL_ROF');
	}
}

export async function sendMessageToMember(message: string, member: GuildMember, interaction: Interaction, replyOnSuccess: string, replyOnFailure: string) {
	if (!interaction.isRepliable())
		throw new SpiceCraftError(Errors.discord.notRepliable, ErrorType.discordApi);

	try {
		await member.send(message);
	}
	catch {
		await interaction.reply({ content: replyOnFailure, ephemeral: true });
		return;
	}

	await interaction.reply({ content: replyOnSuccess, ephemeral: true });
}

export const template = require('es6-template-strings');