import * as Strings from '../strings';
import http = require('https');
import { MojangApiError, UserFromMojangApi } from '../models';
import { mojangApiUrl } from '../bot-constants';

export function getMojangUser(username: string): Promise<UserFromMojangApi> {
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
				if ((body as MojangApiError).errorMessage)
					reject(new Error(Strings.errors.api.noMojangAccountWithThatUsername));
				resolve(body as UserFromMojangApi);
			});
		});
		req.on('error', () => {
			reject(new Error(Strings.errors.api.couldNotConnectToApi));
		});
		req.end();
	});
}

export function getUsernameFromUuid(uuid: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const req = http.get(`${mojangApiUrl}/user/profile/${uuid}`, (res) => {
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
				if (!body.name)
					reject(new Error(Strings.errors.api.noMojangAccountWithThatUuid));
				resolve(body.name);
			});
		});
		req.on('error', () => {
			reject(new Error(Strings.errors.api.couldNotConnectToApi));
		});
		req.end();
	});
}