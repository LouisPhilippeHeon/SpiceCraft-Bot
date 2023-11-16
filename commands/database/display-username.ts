import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as HttpService from '../../services/http';
import * as Strings from '../../strings';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afficher-username')
        .setDescription(Strings.commands.displayUsername.description)
        .addUserOption(option =>
			option.setName('membre')
				.setDescription(Strings.commands.displayUsername.userOptionDescription)
				.setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const discordUuid = interaction.options.getUser('membre').id;
            const minecraftUuid = (await DatabaseService.getUserByDiscordUuid(discordUuid)).minecraft_uuid;
            const usernameMinecraft = await HttpService.getUsernameFromUuid(minecraftUuid);
            await interaction.reply(usernameMinecraft);
        }
        catch (e) {
            await interaction.reply(e.message);
        }
    }
};

