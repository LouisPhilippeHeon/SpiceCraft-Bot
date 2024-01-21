import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';

export const data = new ButtonData('dissmiss', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();
}