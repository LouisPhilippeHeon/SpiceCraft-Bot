import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as Texts from '../../texts'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('supprimer-entree')
		.setDescription('Supprime une rangée dans la base de données.')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Retirer l\'entrée pour quel id ?')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		const option = interaction.options.getInteger('id');
		try {
			await DatabaseService.deleteEntry(option);
			await interaction.reply(Texts.deleteEntry.reply)
		}
		catch (e) {
			await interaction.reply(e.message);
		}
	}
};