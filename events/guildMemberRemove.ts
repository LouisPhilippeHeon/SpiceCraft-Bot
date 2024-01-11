import { ActionRowBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember, MessageCreateOptions } from 'discord.js';
import * as DatabaseService from '../services/database';
import * as AdminApprovalService from '../services/admin-approval';
import * as Utils from '../utils';
import * as Strings from '../strings';
import * as Constants from '../bot-constants';
import { UserFromDb } from '../models';

module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(member: GuildMember) {
		try {
			const userFromDb = await DatabaseService.getUserByDiscordUuid(member.user.id);
			if (!userFromDb) return;

			// If user leaves server or was banned before his request was approved
			if (userFromDb.inscription_status === Constants.inscriptionStatus.awaitingApproval) {
				await (await AdminApprovalService.findApprovalRequestOfMember(member.guild, member.user.id)).delete();
				await DatabaseService.deleteEntry(member.user.id);
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
			if (e.code === 50013) console.error('Le bot n\'a pas la permission de lire les logs.');
			else console.error(e);
		}
	}
}

async function handleUserLeft(member: GuildMember) {
	const whitelistChannel = await Utils.fetchBotChannel(member.guild);
	await whitelistChannel.send(createMessage(member.user.id));
}

async function handleBan(userFromDb: UserFromDb, member: GuildMember) {
	if (userFromDb.inscription_status === Constants.inscriptionStatus.rejected) return;

	await DatabaseService.changeStatus(member.user.id, Constants.inscriptionStatus.rejected);
	const whitelistChannel = await Utils.fetchBotChannel(member.guild);
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
		description: Strings.components.descriptions.userLeft.replace('$discordUuid$', discordUuid)
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);
	return { embeds: [deleteEmbed], components: [row] }
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
		description: Strings.components.descriptions.userBanned.replace('$discordUuid$', bannedUuid)
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBan, ignore);
	return { embeds: [banEmbed], components: [row] }
}