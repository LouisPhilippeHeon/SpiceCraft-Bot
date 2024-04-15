import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';

export const data = new ButtonData('dismiss', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();
}