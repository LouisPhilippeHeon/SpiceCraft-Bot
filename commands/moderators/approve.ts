import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../services/user-status';
import { inscriptionStatus } from '../../bot-constants';
import * as Strings from '../../strings';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('approuver')
		.setDescription(Strings.commands.approve.description)
		.addUserOption(option =>
			option.setName('membre')
				.setDescription(Strings.commands.approve.memberOptionDescription)
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription(Strings.commands.approve.silentOptionDescription))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.approved);
	}
}