import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember } from 'discord.js';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Texts from '../texts';

module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(member: GuildMember) {
		try {
			// Only there to test if user exists in the database
			const userFromDb = await DatabaseService.getUserByDiscordUuid(member.user.id);
			const whitelistChannel = await Utils.fetchBotChannel(member.guild);

			const confirmDelete = new ButtonBuilder()
				.setCustomId(`delete-${userFromDb.discord_uuid}`)
				.setLabel(Texts.embeds.components.yes)
				.setStyle(ButtonStyle.Danger);

			const cancel = new ButtonBuilder()
				.setCustomId('cancel')
				.setLabel(Texts.embeds.components.ignore)
				.setStyle(ButtonStyle.Secondary);

			const deleteEmbed = new EmbedBuilder()
				.setTitle(Texts.embeds.titles.userLeft)
				.setDescription(Texts.embeds.descriptions.userLeft.replace('$discordUuid$', userFromDb.discord_uuid));

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, cancel);

			await whitelistChannel.send({ embeds: [deleteEmbed], components: [row] });
		}
		catch { }
	}
}