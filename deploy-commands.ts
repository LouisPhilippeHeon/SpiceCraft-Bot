import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from './config';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath).filter((folder: string) => !folder.endsWith('.DS_Store'));
for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = join(foldersPath, folder);
	console.log(commandsPath)
	const commandFiles = readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		}
		else {
			console.log(`La commande ${filePath} n'a pas les propriétés "data" ou "execute".`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
	try {
		console.log(`Début du rafraichissement de ${commands.length} commandes slash.`);

		// Refresh all commands in the guild with the current set
		const data: any = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Rafraichissement réussi de ${data.length} commandes slash.`);
	}
	catch (error) {
		console.error(error);
	}
})();
