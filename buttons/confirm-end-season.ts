import { ButtonData } from '../models';
import * as Strings from '../strings';
import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { fetchBotChannel, fetchPlayerRole } from '../utils';
import { getUsers, syncTags } from '../services/database';
import { filenameSeasonSave } from '../bot-constants';

export const data = new ButtonData('confirm-end-season', PermissionFlagsBits.Administrator);

let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    await interaction.message.edit({ content: Strings.commands.endSeason.seasonEnded, components: [] });await
    
    sendBackupToInteractionAuthor();

    await interaction.reply({ content: Strings.commands.endSeason.newSeasonBegins, ephemeral: true });
    syncTags(true);
    
    const playerRole = await fetchPlayerRole(interaction.guild, false);
    if (playerRole) await playerRole.delete();
    
    const botChannel = await fetchBotChannel(interaction.guild, false);
    if (botChannel) await botChannel.delete();
}

async function sendBackupToInteractionAuthor() {
    const users = await getUsers();
    if (users.length > 0) {
        await interaction.user.send({
            files: [{
                attachment: Buffer.from(JSON.stringify(users)),
                name: filenameSeasonSave
            }]
        }).catch(async () => console.log(JSON.stringify(users)));
    }
}