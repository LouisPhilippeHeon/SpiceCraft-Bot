import { inscriptionStatus } from '../../bot-constants';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands } from '../../strings';
import { editUserStatus } from '../../services/user-status';

export const data = new SlashCommandBuilder()
	.setName('approuver')
	.setDescription(Commands.approve.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.approve.memberOptionDescription)
			  .setRequired(true))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(Commands.approve.silentOptionDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
	await editUserStatus(interaction, inscriptionStatus.approved);
}