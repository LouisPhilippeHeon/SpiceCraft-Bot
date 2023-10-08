import fs = require('node:fs');
import path = require('node:path');
import { ActionRowBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js';
import { clientId, token } from './config';
import * as DatabaseService from './services/database';
import * as Register from './actions/register';
import * as HandleButton from './actions/handle-button';
import * as Utils from './utils'
import * as Constants from './bot-constants';
import * as Models from './models';

const erreurCommandeText = 'Une erreur s\'est produite lors de l\'exécution de cette commande!';
// Create a new client instance
Utils.client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath).filter(folder => !folder.endsWith('.DS_Store'));

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Collection where the key is the command and the value is the exported module
		if ('data' in command && 'execute' in command) {
			Utils.client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

Utils.client.once(Events.ClientReady, client => {
	DatabaseService.tags.sync();

	console.log(`Ready! Logged in as ${client.user.tag}`);
});

Utils.client.on(Events.InteractionCreate, async (interaction: Models.InteractionWithCommands) => {
	if (interaction.isButton()) {
		if (interaction.customId === 'inscription') await Register.handleInscriptionButtonClick(interaction);
		if (interaction.customId === 'cancel') await interaction.message.delete();
		if (interaction.customId === 'confirm-new-season') await HandleButton.confirmEndSeason(interaction);
		if (interaction.customId.startsWith('confirm-reject')) await HandleButton.confirmRejectUser(interaction);
		if (interaction.customId.startsWith('approve')) await HandleButton.approveUser(interaction);
		if (interaction.customId.startsWith('reject')) await HandleButton.rejectUser(interaction);
		if (interaction.customId.startsWith('update')) await HandleButton.confirmUsernameChange(interaction);
		if (interaction.customId.startsWith('delete')) await HandleButton.deleteUser(interaction);
	}

	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`Aucune commande ne corresponsant à ${interaction.commandName} n'a été trouvée.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: erreurCommandeText, ephemeral: true });
		}
		else {
			await interaction.reply({ content: erreurCommandeText, ephemeral: true });
		}
	}
});

Utils.client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember, newMember: GuildMember) => {
	if (oldMember.roles.cache.some(role => role.name === Constants.playerRoleName) && !newMember.roles.cache.some(role => role.name === Constants.playerRoleName)) {
		try {
			const latestMemberRoleUpdateLog = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
			const executor = newMember.guild.members.resolve(latestMemberRoleUpdateLog.entries.first().executor);
			if (executor.user.id !== clientId) await DatabaseService.deleteEntryWithDiscordUuid(newMember.user.id);
		}
		catch (e) {
			if (e.code === 50013) console.log('Le bot a besoin de permission pour lire les logs.');
		}
	}
});

Utils.client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
	try {
		// Only there to test if user exists in the database
		const userFromDb = await DatabaseService.getUserByDiscordUuid(member.user.id);
		const whitelistChannel = await Utils.fetchBotChannel(member.guild);

		const confirmDelete = new ButtonBuilder()
			.setCustomId(`delete-${userFromDb.discord_uuid}`)
			.setLabel('Oui')
			.setStyle(ButtonStyle.Danger);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Ne rien faire')
			.setStyle(ButtonStyle.Secondary);

		const deleteEmbed = new EmbedBuilder()
			.setTitle('Un utilisateur a quitté. Faut-il le retirer de la base de données ?')
			.setDescription(`Compte Discord : <@${userFromDb.discord_uuid}>.`);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmDelete, cancel);

		await whitelistChannel.send({embeds: [deleteEmbed], components: [row] });
	}
	catch { }
});

Utils.client.login(token);