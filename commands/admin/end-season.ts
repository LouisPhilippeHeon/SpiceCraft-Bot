import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { strings } from '../../strings/strings';

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(strings.Commands.endSeason.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder({
		customId: 'confirm-end-season',
		label: strings.Components.buttons.endSeason,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: strings.Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

	await interaction.reply({
		content: strings.Commands.endSeason.warning,
		components: [row]
	});
}