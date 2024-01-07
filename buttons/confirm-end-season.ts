import * as Constants from '../bot-constants';
import { ButtonData } from '../models';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new ButtonData('confirm-end-season', PermissionFlagsBits.Administrator);

let interaction: ButtonInteraction;

export async function confirmEndSeason(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    await interaction.message.edit({ content: Strings.commands.endSeason.seasonEnded, components: [] });await
    
    sendBackupToInteractionAuthor();

    await interaction.reply({ content: Strings.commands.endSeason.newSeasonBegins, ephemeral: true });
    DatabaseService.tags.sync({ force: true });
    
    const playerRole = await Utils.fetchPlayerRole(interaction.guild, false);
    if (playerRole) await playerRole.delete();
    
    const botChannel = await Utils.fetchBotChannel(interaction.guild, false);
    if (botChannel) await botChannel.delete();
}

async function sendBackupToInteractionAuthor() {
    const users = await DatabaseService.getUsers();
    if (users.length > 0) {
        await interaction.user.send({
            files: [{
                attachment: Buffer.from(JSON.stringify(users)),
                name: Constants.filenameSeasonSave
            }]
        }).catch(async () => console.log(JSON.stringify(users)));
    }
}