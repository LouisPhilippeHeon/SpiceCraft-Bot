import * as Strings from '../strings';
import { ButtonData, UserFromDb } from '../models';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { getUserByDiscordUuid } from '../services/database';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('delete', PermissionFlagsBits.Administrator);

let user: UserFromDb;

export async function execute(interaction: ButtonInteraction) {
    await interaction.message.delete();
    const discordUuid = interaction.customId.split('_')[1];

    try {
        user = await getUserByDiscordUuid(discordUuid);
        await user.removeFromWhitelist();
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        return;
    }

    await editApprovalRequest( interaction.message, Strings.commands.deleteEntry.messageUpdate, undefined, [], Colors.Red );
    await interaction.reply({ content: Strings.commands.deleteEntry.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
}