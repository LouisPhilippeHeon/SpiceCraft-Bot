import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as RconService from '../../services/rcon';
import * as HttpService from '../../services/http';
import * as Strings from '../../strings';
import * as Utils from '../../utils';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('supprimer-entree')
		.setDescription(Strings.commands.deleteEntry.description)
		.addStringOption(option =>
			option.setName('discord-uuid')
				.setDescription(Strings.commands.deleteEntry.userIdOption)
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		const discordUuid = interaction.options.getString('discord-uuid');
		try {
			await DatabaseService.deleteEntry(discordUuid);
			await interaction.reply(Strings.commands.deleteEntry.reply);

			const member = await interaction.guild.members.fetch(discordUuid);
			const role = await Utils.fetchPlayerRole(interaction.guild);
			await member.roles.remove(role.id);

			const user = await DatabaseService.getUserByDiscordUuid(discordUuid);
			const username = await HttpService.getUsernameFromUuid(user.minecraft_uuid);
			await RconService.whitelistRemove(username);
		}
		catch (e) {
			// If user is no longer a member, ignore error thrown while trying to remove role
			if (e.message !== 'Unknown Member')
				await interaction.reply(e.message);
		}
	}
};