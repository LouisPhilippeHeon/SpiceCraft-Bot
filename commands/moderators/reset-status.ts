import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { strings } from '../../strings/strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('reinitialiser-statut')
	.setDescription(strings.Commands.resetStatus.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(strings.Commands.resetStatus.userOptionDescription)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.awaitingApproval);
}