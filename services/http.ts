import Axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { mojangApiUrl } from '../bot-constants';
import { error } from './logger';
import { UserFromMojangApi } from '../models';
import { Errors } from '../strings';

const instance = Axios.create();
const axios = setupCache(instance);

export async function getMojangUser(username: string): Promise<UserFromMojangApi> {
	try {
		const response = await axios.get(`${mojangApiUrl}/users/profiles/minecraft/${username}`);
		return response.data;
	} catch (e) {
		const apiError = e.response.data;
		error(JSON.stringify(apiError), 'HTP_FUN');

		if (apiError.error)
			throw new Error(Errors.api.couldNotConnectToApi);
		throw new Error(Errors.api.noMojangAccountWithThatUsername);
	}
}

export async function getUsernameFromUuid(uuid: string): Promise<string> {
	try {
		const response = await axios.get(`${mojangApiUrl}/user/profile/${uuid}`);
		return response.data.name;
	} catch (e) {
		error(JSON.stringify(e.response.data), 'HTP_FID');

		if (e.response.status === 400)
			throw new Error(Errors.api.noMojangAccountWithThatUuid);
		throw new Error(Errors.api.couldNotConnectToApi);
	}
}