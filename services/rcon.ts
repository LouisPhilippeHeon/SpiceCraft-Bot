import { rconConnexions } from '../config';
import { getUsernameFromUuid } from './http';
import { error } from './logger';
import { strings } from '../strings/strings';
import { template } from '../utils';

export async function whitelistAdd(uuid: string) {
	const username = await getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist add ' + username);
			await rcon.end();
		}
	}
	catch (e) {
		error(e);
		throw new Error(template(strings.Errors.rcon.add, { username: username }));
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
	catch (e) {
		error(e);
		throw new Error(template(strings.Errors.rcon.remove, { username: username }));
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
	catch (e) {
		error(e);
		throw new Error(template(strings.Errors.rcon.edit, { oldUsername: oldUsername, newUsername: newUsername }));
	}
}