import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../services/user-status';
import { inscriptionStatus } from '../../bot-constants';
import * as Strings from '../../strings';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rejeter')
		.setDescription(Strings.commands.reject.description)
		.addUserOption(option =>
			option.setName('membre')
				.setDescription(Strings.commands.reject.userOptionDescription)
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('silencieux')
				.setDescription(Strings.commands.reject.silentOptionDescription))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		await editUserStatus(interaction, inscriptionStatus.rejected);
		// TODO Remove from whitelist
	}
};