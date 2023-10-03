import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('supprimer-entree')
		.setDescription('Supprime une rangée dans la base de données.')
		.addIntegerOption(option =>
			option.setName('id')
				.setDescription('Retirer l\'entrée pour quel id ?')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: any) {
		const option = interaction.options.getInteger('id');
		try {
			await DatabaseService.deleteEntry(option);
			await interaction.reply('L\'utilisateur à été supprimé de la base de données.')
		}
		catch (e) {
			await interaction.reply(e.message);
		}
	},
};