import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember } from 'discord.js';
import * as DatabaseService from '../services/database';
import * as AdminApprovalService from '../services/admin-approval';
import * as Utils from '../utils';
import * as Strings from '../strings';
import * as Constants from '../bot-constants';

module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(member: GuildMember) {
		try {
			const userFromDb = await DatabaseService.getUserByDiscordUuid(member.user.id);
			if (!userFromDb) return;

			// If user leaves server before his request was approved
			if (userFromDb.inscription_status === Constants.inscriptionStatus.awaitingApproval) {
				await (await AdminApprovalService.findApprovalRequestOfMember(member.guild, member.user.id)).delete();
				await DatabaseService.deleteEntry(member.user.id);
				return;
			}

			const confirmDelete = new ButtonBuilder({
				customId: `delete_${member.user.id}`,
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
				description: Strings.components.descriptions.userLeft.replace('$discordUuid$', member.user.id)
			});

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);

			const whitelistChannel = await Utils.fetchBotChannel(member.guild);
			await whitelistChannel.send({ embeds: [deleteEmbed], components: [row] });
		}
		catch { }
	}
}