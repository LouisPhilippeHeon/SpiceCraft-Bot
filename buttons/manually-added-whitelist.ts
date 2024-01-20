import * as Strings from '../strings';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../models';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus } from '../services/database';
import { addPlayerRole, fetchGuildMember, sendMessageToMember, template } from '../utils';
import { editApprovalRequest } from '../services/admin-approval';

export const data = new ButtonData('manually-added-whitelist', PermissionFlagsBits.BanMembers);

let member: GuildMember;

export async function execute(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];

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
    await editApprovalRequest(interaction.message, template(Strings.events.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

    await sendMessageToMember(
        Strings.events.approbation.messageSentToPlayerToConfirmInscription,
        member,
        interaction,
        template(Strings.events.approbation.success, {discordUuid: discordUuid}),
        template(Strings.events.approbation.successNoDm, {discordUuid: discordUuid})
    );
}