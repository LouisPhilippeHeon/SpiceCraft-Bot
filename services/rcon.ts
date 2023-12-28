import { rconConnexions } from '../config';
import * as Strings from '../strings';

export async function whitelistAdd(username: string) {
	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			console.log(await rcon.send('whitelist add ' + username));
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.add);
	}
}

export async function whitelistRemove(username: string) {
	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			console.log(await rcon.send('whitelist remove ' + username));
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.remove);
	}
}

export async function whitelistReplaceUsername(newUsername: string, oldUsername: string) {
	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			console.log(await rcon.send('whitelist add ' + newUsername));
			console.log(await rcon.send('whitelist remove ' + oldUsername));
			await rcon.end();
		}
	}
	catch {
		throw new Error(Strings.errors.rcon.edit);
	}
}