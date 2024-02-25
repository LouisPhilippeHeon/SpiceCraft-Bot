import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getUsernameFromUuid } from '../../services/http';
import { strings } from '../../strings/strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-username-minecraft')
	.setDescription(strings.Commands.findMinecraftMember.description)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(strings.Commands.findMinecraftMember.userOptionDescription)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getUser('membre').id;

	try {
		const user = await getUserByDiscordUuid(discordUuid);
		const usernameMinecraft = await getUsernameFromUuid(user.minecraft_uuid);
		await interaction.reply(usernameMinecraft);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}