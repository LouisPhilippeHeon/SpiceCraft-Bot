import { ButtonInteraction, Colors, GuildMember, Message, PermissionFlagsBits } from 'discord.js';
import * as Utils from '../utils';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Constants from '../bot-constants';
import { ButtonData } from '../models';

export const data = new ButtonData('confirm-reject', PermissionFlagsBits.BanMembers);

let member;
let statusChanged = false;

export async function confirmRejectUser(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];
    const messageUuid = interaction.customId.split('_')[2];

    const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
    let approvalRequest: Message = await whitelistChannel.messages.fetch(messageUuid).catch(() => approvalRequest = undefined);

    await interaction.message.delete();

    try {
        await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.approved);
        statusChanged = true;
        member = await Utils.fetchGuildMember(interaction.guild, discordUuid);
    }
	catch (e) {
        if (statusChanged)
            await interaction.reply(e.message + '\n' + Strings.events.rejection.userStillInBdExplanation.replace('$discordUuid$', discordUuid));
        else
            await interaction.reply({ content: e.message, ephemeral: true });
        if (approvalRequest) await approvalRequest.delete();
        return;
    }

    await updateApprovalRequest(approvalRequest, interaction);
    await notifyMember(member, interaction, discordUuid);
}

async function updateApprovalRequest(approvalRequest: Message, interaction: ButtonInteraction) {
    if (approvalRequest) {
        const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
        embedToUpdate.color = Colors.Red;
        await approvalRequest.edit({ content: Strings.events.rejection.requestDenied.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });
    }
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
    try {
        await member.send(Strings.events.rejection.messageSentToUserToInformRejection);
        await interaction.reply({ content: Strings.events.rejection.success.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: Strings.events.rejection.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
}