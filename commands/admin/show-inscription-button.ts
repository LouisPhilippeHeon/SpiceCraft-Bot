import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Texts from '../../texts';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription(Texts.commands.showInscriptionButton.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const register = new ButtonBuilder()
		.setCustomId('inscription')
		.setLabel(Texts.embeds.components.register)
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(register);

	await interaction.deleteReply(Texts.commands.showInscriptionButton.done);

	await interaction.channel.send({
		content: Texts.commands.showInscriptionButton.instructions,
		components: [row]
	});
}