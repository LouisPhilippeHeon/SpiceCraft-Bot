import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../actions/edit-user-status';
import { inscriptionStatus } from '../../bot-constants';
import * as Texts from '../../texts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reinitialiser-statut')
		.setDescription(Texts.commands.resetStatus.description)
		.addUserOption(option =>
			option.setName('membre')
				.setDescription(Texts.commands.resetStatus.userOptionDescription)
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.awaitingApproval);
	}
};