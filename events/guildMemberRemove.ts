import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, GuildMember } from 'discord.js';
import * as DatabaseService from '../services/database'
import * as Utils from '../utils'

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
				.setLabel('Oui')
				.setStyle(ButtonStyle.Danger);

			const cancel = new ButtonBuilder()
				.setCustomId('cancel')
				.setLabel('Ne rien faire')
				.setStyle(ButtonStyle.Secondary);

			const deleteEmbed = new EmbedBuilder()
				.setTitle('Un utilisateur a quitté. Faut-il le retirer de la base de données ?')
				.setDescription(`Compte Discord : <@${userFromDb.discord_uuid}>.`);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, cancel);

			await whitelistChannel.send({ embeds: [deleteEmbed], components: [row] });
		}
		catch { }
	}
}