import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as Constants from '../bot-constants';
import * as RegisteringEvent from './registering';
import { ephemeralInteractions } from '../events/interactionCreate';

export async function inscription(interaction: ButtonInteraction) {
    await DatabaseService.getUserByDiscordUuid(interaction.user.id).then(async (user) => {
        if (user.inscription_status === Constants.inscriptionStatus.rejected)
            await interaction.reply({ content: Strings.services.registering.adminsAlreadyDeniedRequest, ephemeral: true });
        else
            await RegisteringEvent.updateExistingUser(user, interaction);
    }).catch(async () => await askIfFistTimeUser(interaction));
}

async function askIfFistTimeUser(interaction: ButtonInteraction) {
    // Avoid having mutiple of these messages, because it means user could go to register process multiple times
    if (ephemeralInteractions.get(interaction.user.id)) {
        await (ephemeralInteractions.get(interaction.user.id).deleteReply());
        ephemeralInteractions.delete(interaction.user.id);
    }

    const firstTime = new ButtonBuilder({
        customId: 'register-not-first-time',
        label: Strings.components.buttons.yes,
        style: ButtonStyle.Secondary
    });

    const notFirstTime = new ButtonBuilder({
        customId: 'register-first-time',
        label: Strings.components.buttons.no,
        style: ButtonStyle.Secondary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstTime, notFirstTime);
    await interaction.reply(({ content: Strings.events.register.askIfFirstTimePlaying, components: [row], ephemeral: true }));

    ephemeralInteractions.set(interaction.user.id, interaction);
}