import Axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { mojangApiUrl, sessionServer } from '../bot-constants';
import { error } from './logger';
import { UserFromMojangApi } from '../models';
import { strings } from '../strings/strings';

const instance = Axios.create();
const axios = setupCache(instance);

export async function getMojangUser(username: string): Promise<UserFromMojangApi> {
	try {
		const response = await axios.get(`${mojangApiUrl}/users/profiles/minecraft/${username}`);
		return response.data;
	}
	catch (e) {
		const apiError = e.response.data;
		error(JSON.stringify(apiError));

		if (apiError.error)
			throw new Error(strings.Errors.api.couldNotConnectToApi);
		throw new Error(strings.Errors.api.noMojangAccountWithThatUsername);
	}
}

export async function getUsernameFromUuid(uuid: string): Promise<string> {
	try {
		const response = await axios.get(`${sessionServer}/minecraft/profile/${uuid}`);
		return response.data.name;
	} catch (e) {
		error(JSON.stringify(e.response.data));

		if (e.response.status === 400)
			throw new Error(strings.Errors.api.noMojangAccountWithThatUuid);
		throw new Error(strings.Errors.api.couldNotConnectToApi);
	}
}