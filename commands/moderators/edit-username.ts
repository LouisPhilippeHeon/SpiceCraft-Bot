import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';
import { UserFromMojangApi } from '../../models';
import { getMojangUser } from '../../services/http';
import { getUserByDiscordUuid } from '../../services/database';

export const data = new SlashCommandBuilder()
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
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
    const discordUuid = interaction.options.getString('discord-uuid');
    const newUsername = interaction.options.getString('username');

    try {
        let mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);

        const user = await getUserByDiscordUuid(discordUuid);

        await user.editMinecraftUuid(mojangUser.id);
        await user.replaceWhitelistUsername(mojangUser.id);

        await interaction.reply(Strings.commands.editUsername.confirmationMessage);
    }
    catch (e) {
        await interaction.reply(e.message);
    }
}

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<UserFromMojangApi> {
    let userFromDb = await getUserByDiscordUuid(discordUuid);

    if (!userFromDb)
        throw new Error(Strings.errors.database.userDoesNotExist);

    let userFromMojangApi = await getMojangUser(newUsername);

    if (userFromDb.minecraft_uuid === userFromMojangApi.id)
        throw new Error(Strings.commands.editUsername.usernameIdenticalToPreviousOne);

    return userFromMojangApi;
}