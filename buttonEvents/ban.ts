import * as Constants from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ButtonInteraction, Colors } from 'discord.js';

let user;

export async function ban(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];

    try {
        user = await DatabaseService.getUserByDiscordUuid(discordUuid);
        await user.removeFromWhitelist();
        await user.changeStatus(Constants.inscriptionStatus.rejected);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }

    const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
    embedToUpdate.color = Colors.Green;
    await interaction.message.edit({ content: Strings.events.ban.messageUpdate.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });

    await interaction.reply({ content: Strings.events.ban.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
}