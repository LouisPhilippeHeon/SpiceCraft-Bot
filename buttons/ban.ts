import { ButtonData } from '../models';
import { getUserByDiscordUuid } from '../services/database';
import * as Strings from '../strings';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { deepCloneWithJson } from '../utils';
import { inscriptionStatus } from '../bot-constants';

export const data = new ButtonData('ban', PermissionFlagsBits.BanMembers);

let user;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    const discordUuid = interaction.customId.split('_')[1];

    try {
        user = await getUserByDiscordUuid(discordUuid);
        await user.removeFromWhitelist();
        await user.changeStatus(inscriptionStatus.rejected);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }

    await updateEmbed();

    await interaction.reply({ content: Strings.events.ban.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
}

async function updateEmbed() {
    const embedToUpdate = deepCloneWithJson(interaction.message.embeds[0]);
    embedToUpdate.color = Colors.Green;
    await interaction.message.edit({ content: Strings.events.ban.messageUpdate.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });
}