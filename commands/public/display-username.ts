import { getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getUsernameFromUuid } from '../../services/http';
import { UserFromDb } from '../../models';
import { Commands } from '../../strings';

export const data = new SlashCommandBuilder()
	.setName('afficher-username')
	.setDescription(Commands.displayUsername.description)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.displayUsername.userOptionDescription)
			  .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getUser('membre').id;
	let user: UserFromDb;
	let usernameMinecraft: string;

	try {
		user = await getUserByDiscordUuid(discordUuid);
		usernameMinecraft = await getUsernameFromUuid(user.minecraft_uuid);
		await interaction.reply(usernameMinecraft);
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}