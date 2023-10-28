import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../actions/edit-user-status';
import { inscriptionStatus } from '../../bot-constants';
import * as Texts from '../../texts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rejeter')
		.setDescription(Texts.commands.reject.description)
		.addUserOption(option =>
			option.setName('membre')
				.setDescription(Texts.commands.reject.userOptionDescription)
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription(Texts.commands.reject.silentOptionDescription))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.rejected);
	}
};