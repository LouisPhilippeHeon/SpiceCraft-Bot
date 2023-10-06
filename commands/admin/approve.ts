import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../actions/edit-user-status';
import { inscriptionStatus } from '../../bot-constants';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('approuver')
		.setDescription('Approuver le membre du serveur Minecraft et lui ajouter le rôle joueur sur le Discord.')
		.addUserOption(option =>
			option.setName('membre')
				.setDescription('Membre à approuver')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription('Envoyer un message à l\'utilisateur approuvé ?'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.approved);
	},
};