import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands } from '../../strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('rejeter')
	.setDescription(Commands.reject.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.reject.userOptionDescription)
			  .setRequired(true))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(Commands.reject.silentOptionDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.rejected);
}