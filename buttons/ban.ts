import * as Strings from '../strings';
import { ButtonData } from '../models';
import { getUserByDiscordUuid } from '../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { inscriptionStatus } from '../bot-constants';
import { editApprovalRequest } from '../services/admin-approval';

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

    await editApprovalRequest(interaction.message, Strings.events.ban.messageUpdate.replace('$discordUuid$', interaction.user.id), undefined, [], Colors.Green);
    await interaction.reply({ content: Strings.events.ban.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
}