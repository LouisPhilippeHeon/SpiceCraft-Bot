import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as HttpService from '../../services/http';
import * as Strings from '../../strings';

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
        user = await DatabaseService.getUserByDiscordUuid(discordUuid);
        usernameMinecraft = await HttpService.getUsernameFromUuid(user.minecraft_uuid);;
        await interaction.reply(usernameMinecraft);
    }
    catch (e) {
        await interaction.reply(e.message);
    }
}