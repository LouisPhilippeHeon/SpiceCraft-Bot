import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Commands } from '../../strings';
import { fetchGuildMember, removePlayerRole, template } from '../../utils';

export const data = new SlashCommandBuilder()
	.setName('supprimer-entree')
	.setDescription(Commands.deleteEntry.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addStringOption(option =>
		option.setName('discord-uuid')
			  .setDescription(Commands.deleteEntry.userIdOption)
			  .setRequired(true))
	.addBooleanOption(option =>
		option.setName('remove-from-whitelist')
			  .setDescription(Commands.deleteEntry.removeFromWhitelistOption)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getString('discord-uuid');
	const removeFromWhitelistOption = interaction.options.getBoolean('remove-from-whitelist');
	const removeFromWhitelist = removeFromWhitelistOption ?? true;

	try {
		const userFromDb = await getUserByDiscordUuid(discordUuid);
		await userFromDb.delete();

		await fetchGuildMember(interaction.guild, discordUuid).then(
			async (member) => await removePlayerRole(member)
		).catch();

		if (removeFromWhitelist)
			await userFromDb.removeFromWhitelist();
		await interaction.reply({ content: template(Commands.deleteEntry.reply, {discordUuid: discordUuid}), flags: MessageFlags.Ephemeral });
	} catch (e) {
		await interaction.reply(e.message);
	}
}