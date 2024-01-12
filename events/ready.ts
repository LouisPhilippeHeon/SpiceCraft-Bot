import { Client, Events } from 'discord.js';
import { syncTags } from '../services/database';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		syncTags();
		console.log(`Prêt ! Connecté en tant que ${client.user.tag}`);
	}
}