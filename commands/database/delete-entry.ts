import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as Texts from '../../texts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('supprimer-entree')
		.setDescription(Texts.commands.deleteEntry.description)
		.addStringOption(option =>
			option.setName('discord-uuid')
				.setDescription(Texts.commands.deleteEntry.userIdOption)
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		const discordUuid = interaction.options.getString('discord-uuid');
		try {
			// TODO Delete role
			await DatabaseService.deleteEntry(discordUuid);
			await interaction.reply(Texts.commands.deleteEntry.reply);
		}
		catch (e) {
			await interaction.reply(e.message);
		}
	}
};