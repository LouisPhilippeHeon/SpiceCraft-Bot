import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(Strings.commands.endSeason.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder({
		customId: 'confirm-new-season',
		label: Strings.components.buttons.endSeason,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: Strings.components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

	await interaction.reply({
		content: Strings.commands.endSeason.warning,
		components: [row]
	});
}