import { rconConnexions } from "../config"

export async function whitelistAdd(username: string) {
	for (const rcon of rconConnexions) {
		await rcon.connect();
		console.log(await rcon.send('whitelist add ' + username));
		await rcon.end();
	}
}

export async function whitelistRemove(username: string) {
	for (const rcon of rconConnexions) {
		await rcon.connect();
		console.log(await rcon.send('whitelist remove ' + username));
		await rcon.end();
	}
}