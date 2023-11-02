import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../services/user-status';
import { inscriptionStatus } from '../../bot-constants';
import * as Texts from '../../texts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('approuver')
		.setDescription(Texts.commands.approve.description)
		.addUserOption(option =>
			option.setName('membre')
				.setDescription(Texts.commands.approve.memberOptionDescription)
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription(Texts.commands.approve.silentOptionDescription))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.approved);
	}
};