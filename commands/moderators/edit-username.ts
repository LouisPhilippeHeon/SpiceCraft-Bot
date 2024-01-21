import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { UserFromMojangApi } from '../../models';
import { Commands, Errors } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('modifier-username')
	.setDescription(Commands.editUsername.description)
	.addStringOption(option =>
		option.setName('discord-uuid')
			  .setDescription(Commands.editUsername.userOptionDescription)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('username')
			  .setDescription(Commands.editUsername.newUsernameOptionDescription)
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

		await interaction.reply(Commands.editUsername.confirmationMessage);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<UserFromMojangApi> {
	let userFromDb = await getUserByDiscordUuid(discordUuid);

	if (!userFromDb)
		throw new Error(Errors.database.userDoesNotExist);

	let userFromMojangApi = await getMojangUser(newUsername);

	if (userFromDb.minecraft_uuid === userFromMojangApi.id)
		throw new Error(Commands.editUsername.usernameIdenticalToPreviousOne);

	return userFromMojangApi;
}