import { syncTags } from '../services/database';
import { Client, Events } from 'discord.js';
import { Logs } from '../strings';
import { template } from '../utils';

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		await syncTags();
		console.log(template(Logs.ready, {username: client.user.username}));
	}
}