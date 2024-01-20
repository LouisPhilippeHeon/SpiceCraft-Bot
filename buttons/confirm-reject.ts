import * as Strings from '../strings';
import { ButtonInteraction, Colors, GuildMember, Message, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { fetchBotChannel, fetchGuildMember, template } from '../utils';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus } from '../services/database';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('confirm-reject', PermissionFlagsBits.BanMembers);

let member: GuildMember;
let statusChanged = false;

export async function execute(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];
    const messageUuid = interaction.customId.split('_')[2];

    const whitelistChannel = await fetchBotChannel(interaction.guild);
    let approvalRequest: Message = await whitelistChannel.messages.fetch(messageUuid).catch(() => approvalRequest = undefined);

    await interaction.message.delete();

    try {
        await changeStatus(discordUuid, inscriptionStatus.approved);
        statusChanged = true;
        member = await fetchGuildMember(interaction.guild, discordUuid);
    }
	catch (e) {
        if (statusChanged)
            await interaction.reply(e.message + '\n' + template(Strings.events.rejection.userStillInBdExplanation, {discordUuid: discordUuid}));
        else
            await interaction.reply({ content: e.message, ephemeral: true });
        if (approvalRequest) await approvalRequest.delete();
        return;
    }

    if (approvalRequest)
        await editApprovalRequest(approvalRequest, template(Strings.events.rejection.requestDenied, {discordUuid: interaction.user.id}), undefined, [], Colors.Red);

    await notifyMember(member, interaction, discordUuid);
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
    try {
        await member.send(Strings.events.rejection.messageSentToUserToInformRejection);
        await interaction.reply({ content: template(Strings.events.rejection.success, {discordUuid: discordUuid}), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: template(Strings.events.rejection.successNoDm, {discordUuid: discordUuid}), ephemeral: true });
    }
}