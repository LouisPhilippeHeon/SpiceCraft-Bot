import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as Strings from '../../strings';
import { getUsernameFromUuid } from '../../services/http';
import { getUserByDiscordUuid } from '../../services/database';

export const data = new SlashCommandBuilder()
    .setName('afficher-username')
    .setDescription(Strings.commands.displayUsername.description)
    .addUserOption(option =>
		option.setName('membre')
            .setDescription(Strings.commands.displayUsername.userOptionDescription)
			.setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const discordUuid = interaction.options.getUser('membre').id;
    let user, usernameMinecraft;

    try {
        user = await getUserByDiscordUuid(discordUuid);
        usernameMinecraft = await getUsernameFromUuid(user.minecraft_uuid);
        await interaction.reply(usernameMinecraft);
    }
    catch (e) {
        await interaction.reply(e.message);
    }
}