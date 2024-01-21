import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands } from '../../strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('rejeter')
	.setDescription(Commands.reject.description)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.reject.userOptionDescription)
			  .setRequired(true))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(Commands.reject.silentOptionDescription))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.rejected);
}