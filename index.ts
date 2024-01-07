import fs = require('node:fs');
import path = require('node:path');
import { Collection } from 'discord.js';
import { token } from './config';
import { client } from './bot-constants';

client.commands = new Collection();

const commandPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandPath).filter(folder => !folder.endsWith('.DS_Store'));

for (const folder of commandFolders) {
	const commandsPath = path.join(commandPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command)
			client.commands.set(command.data.name, command);
		else
			console.log(`La commande ${filePath} n'a pas les propriétés "data" ou "execute".`);
	}
}

const buttonsPath = path.join(__dirname, 'buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of buttonFiles) {
	const filePath = path.join(buttonsPath, file);
	const button = require(filePath);

	if ('data' in button && 'execute' in button)
		client.buttons.set(button.data.name, button);
	else
		console.log(`Le bouton ${filePath} n'a pas les propriétés "data" ou "execute".`);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	if (event.once)
		client.once(event.name, (...args) => event.execute(...args));
	else
		client.on(event.name, (...args) => event.execute(...args));
}

client.login(token);