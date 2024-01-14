import * as Strings from '../../strings';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../services/user-status';
import { inscriptionStatus } from '../../bot-constants';

export const data = new SlashCommandBuilder()
	.setName('rejeter')
	.setDescription(Strings.commands.reject.description)
	.addUserOption(option =>
		option.setName('membre')
			.setDescription(Strings.commands.reject.userOptionDescription)
			.setRequired(true))
	.addBooleanOption(option =>
		option.setName('silencieux')
			.setDescription(Strings.commands.reject.silentOptionDescription))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.rejected);
}