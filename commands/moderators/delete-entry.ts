import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';
import { fetchGuildMember, removePlayerRole } from '../../utils';
import { getUserByDiscordUuid } from '../../services/database';

export const data = new SlashCommandBuilder()
	.setName('supprimer-entree')
	.setDescription(Strings.commands.deleteEntry.description)
	.addStringOption(option =>
		option.setName('discord-uuid')
			.setDescription(Strings.commands.deleteEntry.userIdOption)
			.setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getString('discord-uuid');
	try {
		const user = await getUserByDiscordUuid(discordUuid);
		await user.delete();

		await fetchGuildMember(interaction.guild, discordUuid).then(
			async (member) => await removePlayerRole(member)
		).catch();

		await user.removeFromWhitelist();
		await interaction.reply({ content: Strings.commands.deleteEntry.reply.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}