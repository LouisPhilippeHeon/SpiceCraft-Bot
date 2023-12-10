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
        const discordUuid = interaction.options.getUser('membre').id;
        const userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

        if (!userFromDb) {
            await interaction.reply(Strings.errors.database.userDoesNotExist);
            return;
        }

        try {
            const usernameMinecraft = await HttpService.getUsernameFromUuid(userFromDb.minecraft_uuid);
            await interaction.reply(usernameMinecraft);
        }
        catch (e) {
            await interaction.reply(e.message);
        }
    }
};