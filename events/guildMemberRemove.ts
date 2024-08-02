import { findApprovalRequestOfMember } from '../services/admin-approval';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus, deleteEntry, getUserByDiscordUuid } from '../services/database';
import { ActionRowBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember, MessageCreateOptions } from 'discord.js';
import { info } from '../services/logger';
import { Components, Logs } from '../strings';
import { UserFromDb } from '../models/user-from-db';
import { fetchBotChannel, template } from '../utils';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
	info(template(Logs.memberLeft, {username: member.user.username}));
	const userFromDb: UserFromDb | null = await getUserByDiscordUuid(member.user.id).catch(() => null);
	if (!userFromDb) return;

	// If user leaves server or was banned before his request was approved
	if (userFromDb.isAwaitingApproval()) {
		await (await findApprovalRequestOfMember(member.guild, member.user)).delete();
		await deleteEntry(member.user.id);
		return;
	}

	const auditLog = await member.guild.fetchAuditLogs({
		type: AuditLogEvent.MemberBanAdd,
		limit: 1
	});

	if (auditLog.entries.size > 0 && auditLog.entries.first().createdTimestamp > (Date.now() - 5000))
		await handleBan(userFromDb, member);
	else
		await handleUserLeft(member);
}

async function handleUserLeft(member: GuildMember) {
	const whitelistChannel = await fetchBotChannel(member.guild);
	await whitelistChannel.send(createMessage(member.user.id));
}

async function handleBan(userFromDb: UserFromDb, member: GuildMember) {
	if (userFromDb.isRejected()) return;

	await changeStatus(member.user.id, inscriptionStatus.rejected);
	const whitelistChannel = await fetchBotChannel(member.guild);
	await whitelistChannel.send(createMessageBanned(member.user.id));
}

function createMessage(discordUuid: string): MessageCreateOptions {
	const confirmDelete = new ButtonBuilder({
		customId: `delete_${discordUuid}`,
		label: Components.buttons.yes,
		style: ButtonStyle.Danger
	});

	const ignore = new ButtonBuilder({
		customId: 'dismiss',
		label: Components.buttons.ignore,
		style: ButtonStyle.Secondary
	});

	const deleteEmbed = new EmbedBuilder({
		title: Components.titles.userLeft,
		description: template(Components.descriptions.discordAccount, {discordUuid: discordUuid})
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);
	return { embeds: [deleteEmbed], components: [row] };
}

function createMessageBanned(bannedUuid: string): MessageCreateOptions {
	const confirmBan = new ButtonBuilder({
		customId: `ban_${bannedUuid}`,
		label: Components.buttons.yes,
		style: ButtonStyle.Danger
	});

	const ignore = new ButtonBuilder({
		customId: 'dismiss',
		label: Components.buttons.ignore,
		style: ButtonStyle.Secondary
	});

	const banEmbed = new EmbedBuilder({
		title: Components.titles.userBanned,
		description: template(Components.descriptions.discordAccount, {discordUuid: bannedUuid})
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBan, ignore);
	return { embeds: [banEmbed], components: [row] };
}