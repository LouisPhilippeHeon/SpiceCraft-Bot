import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as HttpService from '../../services/http';
import * as Texts from '../../texts';
import * as Models from '../../models';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modifier-username')
        .setDescription(Texts.commands.editUsername.description)
        .addStringOption(option =>
            option.setName('discord-uuid')
                .setDescription(Texts.commands.editUsername.userOptionDescription)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription(Texts.commands.editUsername.newUsernameOptionDescription)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
        const discordUuid = interaction.options.getString('discord-uuid');
        const newUsername = interaction.options.getString('username');

        try {
            let mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);
            await DatabaseService.changeMinecraftUuid(discordUuid, mojangUser.id);
            await interaction.reply(Texts.commands.editUsername.confirmationMessage);
        }
        catch (e) {
            if (e.name == 'SequelizeUniqueConstraintError') {
                await interaction.reply(Texts.errors.usernameUsedWithAnotherAccount);
                return;
            }
            await interaction.reply(e.message);
        }
    }
};

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<Models.UserFromMojangApi> {
    let userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);
    let userFromMojangApi = await HttpService.getMojangUser(newUsername);

    if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
        throw new Error(Texts.commands.editUsername.usernameIdenticalToPreviousOne);
    }
    return userFromMojangApi;
}