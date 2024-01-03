import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ButtonInteraction, Colors } from 'discord.js';

export async function deleteUser(interaction: ButtonInteraction) {
    await interaction.message.delete();
    const discordUuid = interaction.customId.split('_')[1];
    let user;

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