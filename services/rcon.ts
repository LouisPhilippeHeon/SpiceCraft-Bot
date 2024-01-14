import * as Strings from '../strings';
import { rconConnexions } from '../config';
import { getUsernameFromUuid } from './http';

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
		throw new Error(Strings.errors.rcon.add.replace('$username$', username));
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
		throw new Error(Strings.errors.rcon.remove.replace('$username$', username));
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
		throw new Error(Strings.errors.rcon.edit.replace('$oldUsername$', oldUsername).replace('$newUsername$', newUsername));
	}
}