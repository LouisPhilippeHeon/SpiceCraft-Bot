import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

const instructionsForRegistering = 'Pour vous inscrire veuillez cliquer sur le bouton. Le bot va vous envoyer un message privé pour compléter votre inscription.\n**Si vous avez entré un nom d\'utilisateur erroné lors de la configuration initiale, cliquez sur le bouton à nouveau.**';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription('Envoie un message avec un bouton permettant de s\'inscrire.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const register = new ButtonBuilder()
		.setCustomId('inscription')
		.setLabel('S\'inscrire')
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(register);

	await interaction.deleteReply('Fait !');

	await interaction.channel.send({
		content: instructionsForRegistering,
		components: [row]
	});
}