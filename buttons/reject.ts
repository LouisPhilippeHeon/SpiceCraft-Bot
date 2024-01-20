import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { template } from '../utils';

export const data = new ButtonData('reject', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];

    const confirmRejection = new ButtonBuilder({
        customId: `confirm-reject_${discordUuid}_${interaction.message.id}`,
        label: Strings.components.buttons.reject,
        style: ButtonStyle.Danger
    });

    const cancel = new ButtonBuilder({
        customId: 'dissmiss',
        label: Strings.components.buttons.cancel,
        style: ButtonStyle.Secondary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
    await interaction.reply({ content: template(Strings.events.rejection.askConfirmation, {discordUuid: discordUuid}), components: [row] });
}