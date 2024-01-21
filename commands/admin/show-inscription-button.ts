import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands, Components } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription(Commands.showInscriptionButton.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
	const register = new ButtonBuilder({
		customId: 'inscription',
		label: Components.buttons.register,
		style: ButtonStyle.Primary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(register);

	await interaction.channel.send({
		content: Commands.showInscriptionButton.instructions,
		components: [row]
	});

	await interaction.reply(Commands.showInscriptionButton.done);
	await interaction.deleteReply();
}