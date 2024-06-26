import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getUsernameFromUuid } from '../../services/http';
import { Commands } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-username-minecraft')
	.setDescription(Commands.findMinecraftMember.description)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.findMinecraftMember.userOptionDescription)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getUser('membre').id;

	try {
		const userFromDb = await getUserByDiscordUuid(discordUuid);
		const usernameMinecraft = await getUsernameFromUuid(userFromDb.minecraft_uuid);
		await interaction.reply(usernameMinecraft);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}