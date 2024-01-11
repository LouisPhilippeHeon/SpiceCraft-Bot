import { ButtonData } from '../models';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';

export const data = new ButtonData('delete', PermissionFlagsBits.Administrator);

let user;

export async function execute(interaction: ButtonInteraction) {
    await interaction.message.delete();
    const discordUuid = interaction.customId.split('_')[1];

    try {
        user = await DatabaseService.getUserByDiscordUuid(discordUuid);
        await user.removeFromWhitelist();
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        return;
    }

    // Member might have already been deleted, in this case, it will throw an error
    await user.delete().catch();

    const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
    embedToUpdate.color = Colors.Red;

    await interaction.message.edit({ content: Strings.commands.deleteEntry.messageUpdate, embeds: [embedToUpdate], components: [] });

    await interaction.reply({ content: Strings.commands.deleteEntry.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
}