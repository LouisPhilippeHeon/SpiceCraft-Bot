import * as Strings from '../../strings';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { editUserStatus } from '../../services/user-status';
import { inscriptionStatus } from '../../bot-constants';

export const data = new SlashCommandBuilder()
	.setName('reinitialiser-statut')
	.setDescription(Strings.commands.resetStatus.description)
	.addUserOption(option =>
		option.setName('membre')
			.setDescription(Strings.commands.resetStatus.userOptionDescription)
			.setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.awaitingApproval);
}