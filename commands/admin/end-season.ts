import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(Strings.commands.endSeason.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder()
		.setCustomId('confirm-new-season')
		.setLabel(Strings.embeds.components.endSeason)
		.setStyle(ButtonStyle.Danger);

	const cancel = new ButtonBuilder()
		.setCustomId('dissmiss')
		.setLabel(Strings.embeds.components.cancel)
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(confirm, cancel);

	await interaction.reply({
		content: Strings.commands.endSeason.warning,
		components: [row]
	});
}