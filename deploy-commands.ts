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
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Refresh all commands in the guild with the current set
		const data: any = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();
