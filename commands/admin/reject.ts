import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../actions/edit-user-status';
import { inscriptionStatus } from '../../bot-constants';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rejeter')
		.setDescription('Rejeter le membre du serveur Minecraft et lui retirer le rôle joueur sur le Discord.')
		.addUserOption(option =>
			option.setName('membre')
				.setDescription('Membre à rejeter')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription('Envoyer un message à l\'utilisateur rejeté ?'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: any) {
		await editUserStatus(interaction, inscriptionStatus.rejected);
	},
};