import * as Strings from '../strings';
import { ActionRowBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember, MessageCreateOptions } from 'discord.js';
import { UserFromDb } from '../models';
import { fetchBotChannel } from '../utils';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus, deleteEntry, getUserByDiscordUuid } from '../services/database';
import { findApprovalRequestOfMember } from '../services/admin-approval';

const template = require('es6-template-strings');
let userFromDb;

module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(member: GuildMember) {
		try {
			userFromDb = await getUserByDiscordUuid(member.user.id).catch(() => userFromDb = null);
			if (!userFromDb) return;

			// If user leaves server or was banned before his request was approved
			if (userFromDb.inscription_status === inscriptionStatus.awaitingApproval) {
				await (await findApprovalRequestOfMember(member.guild, member.user.id)).delete();
				await deleteEntry(member.user.id);
				return;
			}

			const auditLog = await member.guild.fetchAuditLogs({
				type: AuditLogEvent.MemberBanRemove,
				limit: 1
			});

			if (auditLog.entries.size > 0)
				await handleBan(userFromDb, member);
			else
				await handleUserLeft(member);
		}
		catch (e) {
			if (e.code === 50013) console.error(Strings.errors.cantReadLogs);
			else console.error(e);
		}
	}
}

async function handleUserLeft(member: GuildMember) {
	const whitelistChannel = await fetchBotChannel(member.guild);
	await whitelistChannel.send(createMessage(member.user.id));
}

async function handleBan(userFromDb: UserFromDb, member: GuildMember) {
	if (userFromDb.inscription_status === inscriptionStatus.rejected) return;

	await changeStatus(member.user.id, inscriptionStatus.rejected);
	const whitelistChannel = await fetchBotChannel(member.guild);
	await whitelistChannel.send(createMessageBanned(member.user.id));
}

function createMessage(discordUuid: string): MessageCreateOptions {
	const confirmDelete = new ButtonBuilder({
	customId: `delete_${discordUuid}`,
	label: Strings.components.buttons.yes,
	style: ButtonStyle.Danger
	});

	const ignore = new ButtonBuilder({
		customId: 'dissmiss',
		label: Strings.components.buttons.ignore,
		style: ButtonStyle.Secondary
	});

	const deleteEmbed = new EmbedBuilder({
		title: Strings.components.titles.userLeft,
		description: template(Strings.components.descriptions.userLeft, {discordUuid: discordUuid})
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);
	return { embeds: [deleteEmbed], components: [row] };
}

function createMessageBanned(bannedUuid: string): MessageCreateOptions {
	const confirmBan = new ButtonBuilder({
		customId: `ban_${bannedUuid}`,
		label: Strings.components.buttons.yes,
		style: ButtonStyle.Danger
	});

	const ignore = new ButtonBuilder({
		customId: 'dissmiss',
		label: Strings.components.buttons.ignore,
		style: ButtonStyle.Secondary
	});

	const banEmbed = new EmbedBuilder({
		title: Strings.components.titles.userBanned,
		description: template(Strings.components.descriptions.userBanned, {discordUuid: bannedUuid})
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBan, ignore);
	return { embeds: [banEmbed], components: [row] };
}