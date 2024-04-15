import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { UserFromMojangApi } from '../../models';
import { Commands } from '../../strings';

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

	try {
		const mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);

		const user = await getUserByDiscordUuid(discordUuid);
		await user.editMinecraftUuid(mojangUser.id);
		await user.replaceWhitelistUsername(mojangUser.id);

		await interaction.reply(Commands.editUsername.confirmationMessage);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<UserFromMojangApi> {
	const userFromDb = await getUserByDiscordUuid(discordUuid);

	const userFromMojangApi = await getMojangUser(newUsername);

	if (userFromDb.minecraft_uuid === userFromMojangApi.id)
		throw new Error(Commands.editUsername.usernameIdenticalToPreviousOne);

	return userFromMojangApi;
}