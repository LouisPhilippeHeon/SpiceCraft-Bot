import { getUserByMinecraftUuid } from '../../services/database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { Commands, Errors } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('trouver-membre-discord')
	.setDescription(Commands.findDiscordMember.description)
	.addStringOption(option =>
		option.setName('username')
			  .setDescription(Commands.findDiscordMember.usernameOptionDescription)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const username = interaction.options.getString('username');

	try {
		const minecraftUuid = (await getMojangUser(username)).id;
		const user = await getUserByMinecraftUuid(minecraftUuid);
		if (user)
			await interaction.reply(`<@${user.discord_uuid}>`);
		else
			await interaction.reply(Errors.database.userDoesNotExist);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}