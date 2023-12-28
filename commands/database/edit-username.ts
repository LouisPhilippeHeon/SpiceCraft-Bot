import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as RconService from '../../services/rcon';
import * as HttpService from '../../services/http';
import * as Strings from '../../strings';
import * as Models from '../../models';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modifier-username')
        .setDescription(Strings.commands.editUsername.description)
        .addStringOption(option =>
            option.setName('discord-uuid')
                .setDescription(Strings.commands.editUsername.userOptionDescription)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription(Strings.commands.editUsername.newUsernameOptionDescription)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
        const discordUuid = interaction.options.getString('discord-uuid');
        const newUsername = interaction.options.getString('username');

        try {
            let mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);
            
            const user = await DatabaseService.getUserByDiscordUuid(discordUuid);
            await RconService.whitelistReplaceUsername(mojangUser.id, user.minecraft_uuid);

            await DatabaseService.changeMinecraftUuid(discordUuid, mojangUser.id);
            await interaction.reply(Strings.commands.editUsername.confirmationMessage);
        }
        catch (e) {
            await interaction.reply(e.message);
        }
    }
};

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<Models.UserFromMojangApi> {
    let userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

    if (!userFromDb)
        throw new Error(Strings.errors.database.userDoesNotExist);

    let userFromMojangApi = await HttpService.getMojangUser(newUsername);

    if (userFromDb.minecraft_uuid == userFromMojangApi.id)
        throw new Error(Strings.commands.editUsername.usernameIdenticalToPreviousOne);

    return userFromMojangApi;
}