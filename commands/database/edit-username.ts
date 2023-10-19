import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as DatabaseService from '../../services/database';
import * as HttpService from '../../services/http';
import * as Texts from '../../texts';
import * as Models from '../../models';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('modifier-username')
		.setDescription('Manuellement modifier le nom d\'utilisateur Minecraft d\'un joueur.')
		.addStringOption(option =>
			option.setName('discord-uuid')
				.setDescription('Modifier l\'entrée pour quel UUID Discord ?')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Quel est le nouveau nom d\'utilisateur ?')
                .setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction: ChatInputCommandInteraction) {
		const discordUuid = interaction.options.getString('discord-uuid');
        const newUsername = interaction.options.getString('username');

		try {
            let mojangUser = await getMojangAccountForNewUsername(newUsername, discordUuid);
			await DatabaseService.changeMinecraftUuid(discordUuid, mojangUser.id);
			await interaction.reply('Nom d\'utilisateur changé.')
		}
		catch (e) {
            if (e.name == 'SequelizeUniqueConstraintError') {
				await interaction.reply(Texts.register.usernameUsedWithAnotherAccount);
				return;
			}
			await interaction.reply(e.message);
		}
	}
};

async function getMojangAccountForNewUsername(newUsername: string, discordUuid: string): Promise<Models.UserFromMojangApi> {
    let userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);
    let userFromMojangApi;
    
    try {
        userFromMojangApi = await HttpService.getUuidAndFormatedUsernameFromUsername(newUsername);
    }
    catch(e) {
        throw new Error('Erreur lors de la connexion à l\'API de Mojang.');
    }
    if ((userFromMojangApi as Models.MojangApiError).errorMessage != null) {
        throw new Error('Aucun compte Mojang n\'a ce nom d\'utilisateur !');
    }
    userFromMojangApi = userFromMojangApi as Models.UserFromMojangApi;

    if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
        throw new Error('Pas besoin de changer le nom d\'utilisateur, le nouveau est identique à celui déjà dans la base de données.');
    }
    return userFromMojangApi;
}