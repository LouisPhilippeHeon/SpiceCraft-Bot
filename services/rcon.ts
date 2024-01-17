import * as Strings from '../strings';
import { rconConnexions } from '../config';
import { getUsernameFromUuid } from './http';

const template = require('es6-template-strings');

export async function whitelistAdd(uuid: string) {
	const username = await getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist add ' + username);
			await rcon.end();
		}
	}
	catch {
		throw new Error(template(Strings.errors.rcon.add, {username: username}));
	}
}

export async function whitelistRemove(uuid: string) {
	const username = await getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist remove ' + username);
			await rcon.end();
		}
	}
	catch {
		throw new Error(template(Strings.errors.rcon.remove, {username: username}));
	}
}

export async function whitelistReplaceUsername(newUuid: string, oldUuid: string) {
	const newUsername = await getUsernameFromUuid(newUuid);
	const oldUsername = await getUsernameFromUuid(oldUuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist add ' + newUsername);
			await rcon.send('whitelist remove ' + oldUsername);
			await rcon.end();
		}
	}
	catch {
		throw new Error(template(Strings.errors.rcon.edit, {oldUsername: oldUsername, newUsername: newUsername}));
	}
}