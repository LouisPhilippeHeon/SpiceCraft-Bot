import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription(Strings.commands.showInscriptionButton.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const register = new ButtonBuilder({
		customId: 'inscription',
		label: Strings.components.buttons.register,
		style: ButtonStyle.Primary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(register);

	await interaction.channel.send({
		content: Strings.commands.showInscriptionButton.instructions,
		components: [row]
	});

	await interaction.reply(Strings.commands.showInscriptionButton.done);
	await interaction.deleteReply();
}