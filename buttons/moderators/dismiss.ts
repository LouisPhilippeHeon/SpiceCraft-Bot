import { ButtonData } from '../../models/button-data';
import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new ButtonData('dismiss', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();
}