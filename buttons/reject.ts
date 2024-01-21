import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { ButtonEvents, Components } from '../strings';
import { template } from '../utils';

export const data = new ButtonData('reject', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	const confirmRejection = new ButtonBuilder({
		customId: `confirm-reject_${discordUuid}_${interaction.message.id}`,
		label: Components.buttons.reject,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
	await interaction.reply({ content: template(ButtonEvents.rejection.askConfirmation, {discordUuid: discordUuid}), components: [row] });
}