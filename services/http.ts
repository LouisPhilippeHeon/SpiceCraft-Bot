import http = require('https');
import { MojangApiError, UserFromMojangApi } from '../models';
const mojangApiUrl = 'https://api.mojang.com';

const unableToConnectText = 'Unable to connect to Mojang\'s api';

export function getUuidAndFormatedUsernameFromUsername(username: string): Promise<UserFromMojangApi | MojangApiError> {
	return new Promise((resolve, reject) => {
		const req = http.get(`${mojangApiUrl}/users/profiles/minecraft/${username}`, (res) => {
			let body: any = [];
			res.on('data', function (chunk) {
				body.push(chunk);
			});
			res.on('end', function () {
				try {
					body = JSON.parse(Buffer.concat(body).toString());
				}
				catch (e) {
					reject(e);
				}
				resolve(body);
			});
		});
		req.on('error', () => {
			reject(new Error(unableToConnectText));
		});
		req.end();
	});
};