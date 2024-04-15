import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands, Components } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('terminer-saison')
	.setDescription(Commands.endSeason.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
	const confirm = new ButtonBuilder({
		customId: 'confirm-end-season',
		label: Components.buttons.endSeason,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dismiss',
		label: Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

	await interaction.reply({
		content: Commands.endSeason.warning,
		components: [row]
	});
}