import * as Strings from '../strings';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus } from '../services/database';
import { addPlayerRole, fetchGuildMember } from '../utils';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('manually-added-whitelist', PermissionFlagsBits.BanMembers);

let member: GuildMember;
let interaction: ButtonInteraction;
let discordUuid: string;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    discordUuid = interaction.customId.split('_')[1];

    try {
        member = await fetchGuildMember(interaction.guild, discordUuid);
        await changeStatus(discordUuid, inscriptionStatus.approved);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }

    await addPlayerRole(member);
    await editApprovalRequest(interaction.message, Strings.events.approbation.requestGranted.replace('$discordUuid$', interaction.user.id), undefined, [], Colors.Green);
    await notifyMember();
}

async function notifyMember() {
    try {
        await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
        await interaction.reply({ content: Strings.events.approbation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: Strings.events.approbation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
}