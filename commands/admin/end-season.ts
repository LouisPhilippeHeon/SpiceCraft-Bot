import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Texts from '../../texts';

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(Texts.commands.endSeason.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder()
		.setCustomId('confirm-new-season')
		.setLabel(Texts.embeds.components.endSeason)
		.setStyle(ButtonStyle.Danger);

	const cancel = new ButtonBuilder()
		.setCustomId('cancel')
		.setLabel(Texts.embeds.components.cancel)
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(confirm, cancel);

	await interaction.reply({
		content: Texts.commands.endSeason.warning,
		components: [row]
	});
}