import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Constants from '../../bot-constants'

const warning = `Attention ! Êtes vous certain de vouloir terminer la saison en cours? La base de donnée sera effacée, les rôles seront remis à zéro et tous les messages sur le channel #${Constants.whitelistChannelName} seront effacés.`;

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(`Efface la base de données, efface les messages de #${Constants.whitelistChannelName} et supprime le rôle ${Constants.playerRoleName}.`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder()
		.setCustomId('confirm-new-season')
		.setLabel('Oui, terminer la saison')
		.setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(confirm, cancel);

	await interaction.reply({
		content: warning,
		components: [row]
	});
}