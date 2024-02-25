import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { strings } from '../../strings/strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription(strings.Commands.showInscriptionButton.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
	const register = new ButtonBuilder({
		customId: 'inscription',
		label: strings.Components.buttons.register,
		style: ButtonStyle.Primary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(register);

	await interaction.channel.send({
		content: strings.Commands.showInscriptionButton.instructions,
		components: [row]
	});

	await interaction.reply(strings.Commands.showInscriptionButton.done);
	await interaction.deleteReply();
}