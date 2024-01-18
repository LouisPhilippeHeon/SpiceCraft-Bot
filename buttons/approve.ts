import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../models';
import { inscriptionStatus } from '../bot-constants';
import { addPlayerRole } from '../utils';
import { getUserByDiscordUuid } from '../services/database';
import { editApprovalRequest } from '../services/admin-approval';

const template = require('es6-template-strings');

export const data = new ButtonData('approve', PermissionFlagsBits.BanMembers);

let member, user;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    const discordUuid = interaction.customId.split('_')[1];
    const approvalRequest = interaction.message;

    try {
        user = await getUserByDiscordUuid(discordUuid);
        member = await user.fetchGuildMember(interaction.guild);
        await addToWhitelist(user, discordUuid);
        await user.changeStatus(inscriptionStatus.approved);
    }
	catch (e) {
        if (e.message !== 'rcon-failed') {
            await interaction.reply(e.message);
            await interaction.message.delete();
        }
        return;
    }

    await addPlayerRole(member);
    
    await editApprovalRequest(interaction.message, template(Strings.events.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);
    await notifyMember(member, interaction, discordUuid);
}

async function addToWhitelist(user: UserFromDb, discordUuid: string) {
    try {
        await user.addToWhitelist();
    }
    catch (e) {
        await rconFailed(discordUuid, e);
        throw new Error('rcon-failed');
    }
}

async function rconFailed(discordUuid: string, e: Error) {
    const confirmManualAdditionToWhitelist = new ButtonBuilder({
        customId: `manually-added-whitelist_${discordUuid}`,
        label: Strings.components.buttons.manuallyAddedToWhitelist,
        style: ButtonStyle.Success
    });

    const reject = new ButtonBuilder({
        customId: `reject_${discordUuid}`,
        label: Strings.components.buttons.reject,
        style: ButtonStyle.Danger
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualAdditionToWhitelist, reject);
    await editApprovalRequest(interaction.message, `${e.message} ${template(Strings.events.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

    await interaction.reply({ content: Strings.events.approbation.changeWhitelistBeforeCliking, ephemeral: true });
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
    try {
        await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
        await interaction.reply({ content: template(Strings.events.approbation.success, {discordUuid: discordUuid}), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: template(Strings.events.approbation.successNoDm, {discordUuid: discordUuid}), ephemeral: true });
    }
}