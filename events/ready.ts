import { syncTags } from '../services/database';
import { Client, Events } from 'discord.js';
import { info } from '../services/logger';
import { Logs } from '../strings';
import { template } from '../utils';

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		await syncTags();
		info(template(Logs.ready, {username: client.user.username}));
	}
}