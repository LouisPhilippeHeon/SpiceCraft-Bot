import * as Constants from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ButtonInteraction } from 'discord.js';

export async function confirmEndSeason(interaction: ButtonInteraction) {
    await interaction.message.edit({ content: Strings.commands.endSeason.seasonEnded, components: [] });await
    
    sendBackupToInteractionAuthor(interaction);

    await interaction.reply({ content: Strings.commands.endSeason.newSeasonBegins, ephemeral: true });
    DatabaseService.tags.sync({ force: true });
    
    const playerRole = await Utils.fetchPlayerRole(interaction.guild, false);
    if (playerRole) await playerRole.delete();
    
    // Not calling fetchBotChannel to avoid creating a channel if it is already deleted
    const botChannel = interaction.guild.channels.cache.find(channel => channel.name === Constants.whitelistChannelName);
    if (botChannel) await botChannel.delete();
}

async function sendBackupToInteractionAuthor(interaction: ButtonInteraction) {
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