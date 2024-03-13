import { syncTags } from '../services/database';
import { Client, Events } from 'discord.js';
import { info } from '../services/logger';
import { Logs } from '../strings';
import { template } from '../utils';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
	await syncTags();
	info(template(Logs.ready, {username: client.user.username}));
}