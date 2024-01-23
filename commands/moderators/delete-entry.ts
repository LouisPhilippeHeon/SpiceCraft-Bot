import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
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
	const removeFromWhitelist = removeFromWhitelistOption !== null ? removeFromWhitelistOption : true;

	try {
		const user = await getUserByDiscordUuid(discordUuid);
		await user.delete();

		await fetchGuildMember(interaction.guild, discordUuid).then(
			async (member) => await removePlayerRole(member)
		).catch();

		if (removeFromWhitelist)
			await user.removeFromWhitelist();
		await interaction.reply({ content: template(Commands.deleteEntry.reply, {discordUuid: discordUuid}), ephemeral: true });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}