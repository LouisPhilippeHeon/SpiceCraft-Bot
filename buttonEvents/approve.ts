import * as Constants from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, Message } from 'discord.js';

export async function approveUser(interaction: ButtonInteraction) {
    const discordUuid = interaction.customId.split('_')[1];
    const approvalRequest = interaction.message;
    const user = await DatabaseService.getUserByDiscordUuid(discordUuid);
    let member;

    try {
        member = await user.fetchGuildMember(interaction.guild);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }

    try {
        await user.addToWhitelist();
    }
	catch (e) {
        await rconFailed(interaction, discordUuid, e);
        return;
    }

    try {
        await user.changeStatus(Constants.inscriptionStatus.approved);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await approvalRequest.delete();
        return;
    }

    let role = await Utils.fetchPlayerRole(interaction.guild);
    await member.roles.add(role);
    
    await updateMessage(approvalRequest, interaction);
    await notifyMember(member, interaction, discordUuid);
}

async function rconFailed(interaction: ButtonInteraction, discordUuid: string, e: Error) {
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

    const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
    embedToUpdate.color = Colors.Yellow;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualAdditionToWhitelist, reject);
    await interaction.message.edit({ content: `${e.message} ${Strings.events.clickToConfirmChangesToWhitelist.replace('$discordUuid$', discordUuid)}`, embeds: [embedToUpdate], components: [row] });

    await interaction.reply({ content: Strings.events.approbation.changeWhitelistBeforeCliking, ephemeral: true });
}

async function updateMessage(approvalRequest: Message, interaction: ButtonInteraction) {
    const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
    embedToUpdate.color = Colors.Green;
    await interaction.message.edit({ content: Strings.events.approbation.requestGranted.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
    try {
        await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
        await interaction.reply({ content: Strings.events.approbation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: Strings.events.approbation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
}