import { client } from './bot-constants';
import { token } from './config';
import { Collection } from 'discord.js';
import fs = require('node:fs');
import path = require('node:path');
import { Errors } from './strings';
import { template } from './utils';

client.commands = new Collection();
client.buttons = new Collection();

loadItems('command', 'commands', client.commands);
loadItems('bouton', 'buttons', client.buttons);

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

(async () =>
	await client.login(token)
)();

function loadItems(itemType: string, folderName: string, collection: Collection<string, any>) {
	const itemPath = path.join(__dirname, folderName);
	const itemFolders = fs.readdirSync(itemPath).filter(folder => !folder.endsWith('.DS_Store'));

	for (const folder of itemFolders) {
		const itemFilesPath = path.join(itemPath, folder);
		const itemFiles = fs.readdirSync(itemFilesPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

		for (const file of itemFiles) {
			const filePath = path.join(itemFilesPath, file);
			const item = require(filePath);

			if ('data' in item && 'execute' in item)
				collection.set(item.data.name, item);
			else
				console.log(template(Errors.missingDataOrExecute, {itemType: itemType, filePath: filePath}));
		}
	}
}