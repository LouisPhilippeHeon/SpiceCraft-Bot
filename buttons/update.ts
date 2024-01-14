import * as Strings from '../strings';
import { ButtonData, UserFromDb } from '../models';
import { getUserByDiscordUuid } from '../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('update', PermissionFlagsBits.BanMembers);

let member, user;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    const discordUuid = interaction.customId.split('_')[1];
    const minecraftUuid = interaction.customId.split('_')[2];

    try {
        user = await getUserByDiscordUuid(discordUuid);
        member = await user.fetchGuildMember(interaction.guild);
        await modifyWhitelist(user, minecraftUuid, discordUuid);
        await user.editMinecraftUuid(minecraftUuid);
    }
	catch (e) {
        if (e.message !== 'rcon-failed') {
            await interaction.reply(e.message);
            await interaction.message.delete();
        }
        return;
    }
   
    await editApprovalRequest(interaction.message, Strings.events.usernameChangeConfirmation.messageUpdate.replace('$discordUuid$', interaction.user.id), undefined, [], Colors.Green);
    await notifyMember(member, interaction, discordUuid);
}

async function modifyWhitelist(user: UserFromDb, minecraftUuid: string, discordUuid: string) {
    try {
        await user.replaceWhitelistUsername(minecraftUuid);
    }
    catch (e) {
        await rconFailed(discordUuid, minecraftUuid, e);
        throw new Error('rcon-failed');
    }
}

async function rconFailed(discordUuid: string, minecraftUuid: string, e: Error) {
    const confirmManualModificationOfWhitelist = new ButtonBuilder({
        customId: `manually-modified-whitelist_${discordUuid}_${minecraftUuid}`,
        label: Strings.components.buttons.manuallyEditedWhitelist,
        style: ButtonStyle.Success
    });

    const cancel = new ButtonBuilder({
        customId: 'dissmiss',
        label: Strings.components.buttons.cancel,
        style: ButtonStyle.Secondary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualModificationOfWhitelist, cancel);
    await editApprovalRequest(interaction.message, `${e.message} ${Strings.events.clickToConfirmChangesToWhitelist.replace('$discordUuid$', discordUuid)}`, undefined, [row], Colors.Yellow);

    await interaction.reply({ content: Strings.events.usernameChangeConfirmation.changeWhitelistBeforeCliking, ephemeral: true });
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
    try {
        await member.send(Strings.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange);
        await interaction.reply({ content: Strings.events.usernameChangeConfirmation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: Strings.events.usernameChangeConfirmation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
}