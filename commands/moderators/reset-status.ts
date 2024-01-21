import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands } from '../../strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('reinitialiser-statut')
	.setDescription(Commands.resetStatus.description)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.resetStatus.userOptionDescription)
			  .setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.awaitingApproval);
}