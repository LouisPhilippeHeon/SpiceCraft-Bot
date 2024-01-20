import * as Strings from '../strings';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { changeMinecraftUuid } from '../services/database';
import { fetchGuildMember, sendMessageToMember, template } from '../utils';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

let member: GuildMember;

export async function execute(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];
    const minecraftUuid = interaction.customId.split('_')[2];

    try {
        member = await fetchGuildMember(interaction.guild, discordUuid);
        await changeMinecraftUuid(discordUuid, minecraftUuid);
    }
    catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }
   
    await editApprovalRequest(interaction.message, template(Strings.events.usernameChangeConfirmation.messageUpdate, {discordUuid: discordUuid}), undefined, [], Colors.Green);

    await sendMessageToMember(
        Strings.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange,
        member,
        interaction,
        template(Strings.events.usernameChangeConfirmation.success, {discordUuid: discordUuid}),
        template(Strings.events.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid})
    );
}