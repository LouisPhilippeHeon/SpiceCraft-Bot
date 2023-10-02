import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

const instructionsForRegistering = 'Pour vous inscrire veuillez cliquer sur le bouton. Le bot va vous envoyer un message privé pour compléter votre inscription.\n**Si vous avez entré un nom d\'utilisateur erroné lors de la configuration initiale, cliquez sur le bouton à nouveau.**';
const doneDummyMessage = 'Fait! (Ce message existe uniquement à cause d\'une limitation de l\'API de Discord)';

export const data = new SlashCommandBuilder()
	.setName('afficher-bouton-inscription')
	.setDescription('Envoie un message avec un bouton permettant de s\'inscrire.')
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: any) {
	const register = new ButtonBuilder()
		.setCustomId('inscription')
		.setLabel('S\'inscrire')
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder()
		.addComponents(register);

	await interaction.reply({ content: doneDummyMessage, ephemeral: true });

	await interaction.channel.send({
		content: instructionsForRegistering,
		components: [row],
	});
}