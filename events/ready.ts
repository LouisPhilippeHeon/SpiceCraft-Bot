import { Client, Events } from 'discord.js';
import * as DatabaseService from '../services/database';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		DatabaseService.tags.sync();
		console.log(`Prêt ! Connecté en tant que ${client.user.tag}`);
	},
};