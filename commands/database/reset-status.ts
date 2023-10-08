import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../actions/edit-user-status';
import { inscriptionStatus } from '../../bot-constants';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reinitialiser-statut')
		.setDescription('Remettre le statut d\'un membre à "en attente".')
		.addUserOption(option =>
			option.setName('membre')
				.setDescription('Membre dont il faut réinitialiser le statut')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.awaitingApproval);
	}
};