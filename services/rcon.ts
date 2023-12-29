import { rconConnexions } from '../config';
import * as Strings from '../strings';
import * as HttpService from './http';

export async function whitelistAdd(uuid: string) {
	const username = await HttpService.getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist add ' + username);
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.add);
	}
}

export async function whitelistRemove(uuid: string) {
	const username = await HttpService.getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist remove ' + username);
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.remove);
	}
}

export async function whitelistReplaceUsername(newUuid: string, oldUuid: string) {
	const newUsername = await HttpService.getUsernameFromUuid(newUuid);
	const oldUsername = await HttpService.getUsernameFromUuid(oldUuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.send('whitelist add ' + newUsername);
			await rcon.send('whitelist remove ' + oldUsername);
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.edit);
	}
}