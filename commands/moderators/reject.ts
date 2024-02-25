import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { strings } from '../../strings/strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('rejeter')
	.setDescription(strings.Commands.reject.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(strings.Commands.reject.userOptionDescription)
			  .setRequired(true))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(strings.Commands.reject.silentOptionDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.rejected);
}