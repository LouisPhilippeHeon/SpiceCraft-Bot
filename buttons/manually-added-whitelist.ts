import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import * as Utils from '../utils';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Constants from '../bot-constants';
import { ButtonData } from '../models';

export const data = new ButtonData('manually-added-whitelist', PermissionFlagsBits.BanMembers);

let member;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    const discordUuid = interaction.customId.split('_')[1];

    try {
        member = await Utils.fetchGuildMember(interaction.guild, discordUuid);
        await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.approved);
    }
	catch (e) {
        await interaction.reply({ content: e.message, ephemeral: true });
        await interaction.message.delete();
        return;
    }

    await Utils.addPlayerRole(member);
    await updateEmbed();

    try {
        await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
        await interaction.reply({ content: Strings.events.approbation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
	catch {
        await interaction.reply({ content: Strings.events.approbation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
    }
}

async function updateEmbed() {
    const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
    embedToUpdate.color = Colors.Green;
    await interaction.message.edit({ content: Strings.events.approbation.requestGranted.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });
}