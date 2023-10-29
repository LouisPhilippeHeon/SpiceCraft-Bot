import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember } from 'discord.js';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Texts from '../texts';
import * as Constants from '../bot-constants';

module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(member: GuildMember) {
		try {
			const userFromDb = await DatabaseService.getUserByDiscordUuid(member.user.id);
			const whitelistChannel = await Utils.fetchBotChannel(member.guild);

			if (userFromDb.inscription_status == Constants.inscriptionStatus.awaitingApproval) {
				(await Utils.findApprovalRequestOfMember(member.guild, member.user.id)).delete();
				await DatabaseService.deleteEntry(member.user.id);
				return;
			}

			const confirmDelete = new ButtonBuilder()
				.setCustomId(`delete-${member.user.id}`)
				.setLabel(Texts.embeds.components.yes)
				.setStyle(ButtonStyle.Danger);

			const ignore = new ButtonBuilder()
				.setCustomId('dissmiss')
				.setLabel(Texts.embeds.components.ignore)
				.setStyle(ButtonStyle.Secondary);

			const deleteEmbed = new EmbedBuilder()
				.setTitle(Texts.embeds.titles.userLeft)
				.setDescription(Texts.embeds.descriptions.userLeft.replace('$discordUuid$', member.user.id));

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, ignore);

			await whitelistChannel.send({ embeds: [deleteEmbed], components: [row] });
		}
		catch { }
	}
}