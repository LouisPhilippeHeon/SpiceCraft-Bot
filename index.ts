import fs = require('node:fs');
import path = require('node:path');
import { Collection } from 'discord.js';
import { token } from './config';
import * as Utils from './utils';

Utils.client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath).filter(folder => !folder.endsWith('.DS_Store'));

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Collection where the key is the command and the value is the exported module
		if ('data' in command && 'execute' in command) {
			Utils.client.commands.set(command.data.name, command);
		}
		else {
			console.log(`La commande ${filePath} n'a pas les propriétés "data" ou "execute".`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		Utils.client.once(event.name, (...args) => event.execute(...args));
	} else {
		Utils.client.on(event.name, (...args) => event.execute(...args));
	}
}

Utils.client.login(token);