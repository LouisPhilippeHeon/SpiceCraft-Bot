import fs = require('node:fs');
import path = require('node:path');
import { Collection, Events } from 'discord.js';
import { token } from './config';
import * as DatabaseService from './services/database';
import * as Register from './actions/register';
import * as HandleButton from './actions/handle-button';
import * as Utils from './utils'
import * as Constants from './bot-constants';

const erreurCommandeText = 'Une erreur s\'est produite lors de l\'exécution de cette commande!';
// Create a new client instance
Utils.client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath).filter((folder: string) => !folder.endsWith('.DS_Store'));

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

Utils.client.once(Events.ClientReady, (c: any) => {
	const Tags = DatabaseService.tags;
	Tags.sync({ force: true });
	// Tags.sync();

	console.log(`Ready! Logged in as ${c.user.tag}`);
});

Utils.client.on(Events.InteractionCreate, async (interaction: any) => {
	if (interaction.isButton()) {
		if (interaction.customId === 'inscription') Register.handleInscriptionButtonClick(interaction);
		if (interaction.customId === 'cancel-reject') interaction.message.delete();
		if (interaction.customId.startsWith('confirm-reject')) HandleButton.confirmRejectUser(interaction);
		if (interaction.customId.startsWith('approve')) HandleButton.approveUser(interaction);
		if (interaction.customId.startsWith('reject')) HandleButton.rejectUser(interaction);
		if (interaction.customId.startsWith('update')) HandleButton.confirmUsernameChange(interaction);
	}

	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
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

Utils.client.on('guildMemberUpdate', async (oldMember: any, newMember: any) => {
	if (oldMember.roles.cache.some((role: any) => role.name === Constants.playerRoleName) && !newMember.roles.cache.some((role: any) => role.name === Constants.playerRoleName)) {
		await DatabaseService.deleteUser(newMember.user.id);
	}
});

Utils.client.login(token);