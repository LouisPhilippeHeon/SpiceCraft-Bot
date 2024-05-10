import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SpiceCraftError } from '../../models/error';
import { getMojangUser } from '../../services/http';
import { Commands } from '../../strings';
import { UserFromMojangApi } from '../../models/user-from-mojang-api';

export const data = new SlashCommandBuilder()
	.setName('modifier-username')
	.setDescription(Commands.editUsername.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addStringOption(option =>
		option.setName('discord-uuid')
			  .setDescription(Commands.editUsername.userOptionDescription)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('username')
			  .setDescription(Commands.editUsername.newUsernameOptionDescription)
			  .setMinLength(3)
			  .setMaxLength(32)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getString('discord-uuid');
	const newUsername = interaction.options.getString('username');

	const mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);

	const user = await getUserByDiscordUuid(discordUuid);
	await user.editMinecraftUuid(mojangUser.id);
	await user.replaceWhitelistUsername(mojangUser.id);

	await interaction.reply(Commands.editUsername.confirmationMessage);
}

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<UserFromMojangApi> {
	const userFromDb = await getUserByDiscordUuid(discordUuid);

	const userFromMojangApi = await getMojangUser(newUsername);

	if (userFromDb.minecraft_uuid === userFromMojangApi.id)
		throw new SpiceCraftError(Commands.editUsername.usernameIdenticalToPreviousOne);

	return userFromMojangApi;
}