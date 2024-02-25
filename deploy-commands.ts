import { clientId, guildId, token } from './config';
import { REST, Routes } from 'discord.js';
import { error, info, warn } from './services/logger';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const commands = [];
// Grab all the command files from the commands directory
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath).filter((folder: string) => !folder.endsWith('.DS_Store'));
for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		
		if ('data' in command && 'execute' in command)
			commands.push(command.data.toJSON());
		else
			warn(`La commande ${filePath} n'a pas les propriétés "data" ou "execute".`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
	try {
		info(`Début du rafraichissement de ${commands.length} commandes slash.`);

		// Refresh all commands in the guild with the current set
		const data: any = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		info(`Rafraichissement réussi de ${data.length} commandes slash.`);
	}
	catch (e) {
		error(e, 'DPL_REL');
	}
})();