import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { template } from '../../utils';

export const data = new ButtonData('reject', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	const confirmRejection = new ButtonBuilder({
		customId: `confirm-reject_${discordUuid}_${interaction.message.id}`,
		label: strings.Components.buttons.reject,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: strings.Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
	await interaction.reply({ content: template(strings.ButtonEvents.rejection.askConfirmation, {discordUuid: discordUuid}), components: [row] });
}