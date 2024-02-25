import { syncTags } from '../services/database';
import { Client, Events } from 'discord.js';
import { info } from '../services/logger';
import { strings } from '../strings/strings';
import { template } from '../utils';

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: Client) {
		await syncTags();
		info(template(strings.Logs.ready, {username: client.user.username}));
	}
}