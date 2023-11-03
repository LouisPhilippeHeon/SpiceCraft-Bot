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
			const whitelistChannel = await Utils.fetchBotChannel(member.guild);

			if (userFromDb.inscription_status == Constants.inscriptionStatus.awaitingApproval) {
				(await AdminApprovalService.findApprovalRequestOfMember(member.guild, member.user.id)).delete();
				await DatabaseService.deleteEntry(member.user.id);
				return;
			}

			const confirmDelete = new ButtonBuilder()
				.setCustomId(`delete-${member.user.id}`)
				.setLabel(Strings.embeds.components.yes)
				.setStyle(ButtonStyle.Danger);

			const ignore = new ButtonBuilder()
				.setCustomId('dissmiss')
				.setLabel(Strings.embeds.components.ignore)
				.setStyle(ButtonStyle.Secondary);

			const deleteEmbed = new EmbedBuilder()
				.setTitle(Strings.embeds.titles.userLeft)
				.setDescription(Strings.embeds.descriptions.userLeft.replace('$discordUuid$', member.user.id));

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);

			await whitelistChannel.send({ embeds: [deleteEmbed], components: [row] });
		}
		catch { }
	}
}