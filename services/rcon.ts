import { rconConnexions } from '../config';
import { ErrorType, SpiceCraftError } from '../models/error';
import { getUsernameFromUuid } from './http';
import { Errors } from '../strings';
import { template } from '../utils';

export async function whitelistAdd(uuid: string) {
	const username = await getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.sendCommand('whitelist add ' + username);
			rcon.disconnect();
		}
	}
	catch (e) {
		throw new SpiceCraftError(template(Errors.rcon.add, {username: username}), ErrorType.rcon, e.stack);
	}
}

export async function whitelistRemove(uuid: string) {
	const username = await getUsernameFromUuid(uuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.sendCommand('whitelist remove ' + username);
			rcon.disconnect();
		}
	}
	catch (e) {
		throw new SpiceCraftError(template(Errors.rcon.remove, {username: username}), ErrorType.rcon);
	}
}

export async function whitelistReplaceUsername(newUuid: string, oldUuid: string) {
	const newUsername = await getUsernameFromUuid(newUuid);
	const oldUsername = await getUsernameFromUuid(oldUuid);

	try {
		for (const rcon of rconConnexions) {
			await rcon.connect();
			await rcon.sendCommand('whitelist add ' + newUsername);
			await rcon.sendCommand('whitelist remove ' + oldUsername);
			rcon.disconnect();
		}
	}
	catch (e) {
		throw new SpiceCraftError(template(Errors.rcon.edit, {oldUsername: oldUsername, newUsername: newUsername}), ErrorType.rcon, e.stack);
	}
}