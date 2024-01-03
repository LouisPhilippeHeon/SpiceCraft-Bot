import { ephemeralInteractions } from '../events/interactionCreate';
import * as RegisteringEvent from './registering';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle } from 'discord.js';

export async function register(interaction: ButtonInteraction) {
    const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

    // Disable buttons and style the one that was clicked
    if (interactionWithEphemeral) {
        let components = (await interactionWithEphemeral.fetchReply()).components[0].components;
        const row = new ActionRowBuilder<ButtonBuilder>();

        components.forEach((component: ButtonComponent) => {
            const wasClicked = component.customId === interaction.customId;

            const newComponent = new ButtonBuilder({
                customId: component.customId,
                label: component.label,
                style: (wasClicked) ? ButtonStyle.Primary : component.style,
                disabled: true
            });

            row.addComponents(newComponent);
        });
        await interactionWithEphemeral.editReply({ components: [row] })
    }

    ephemeralInteractions.delete(interaction.user.id);
    await RegisteringEvent.registerUser(interaction, (interaction.customId === 'register-first-time'));
}