import Axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { mojangApiUrl } from '../bot-constants';
import { SpiceCraftError } from '../models/error';
import { error } from './logger';
import { Errors } from '../strings';
import { UserFromMojangApi } from '../models/user-from-mojang-api';

const instance = Axios.create();
const axios = setupCache(instance);

export async function getMojangUser(username: string): Promise<UserFromMojangApi> {
	try {
		const response = await axios.get(`${mojangApiUrl}/users/profiles/minecraft/${username}`);
		return response.data;
	}
	catch (e) {
		const apiError = e.response.data;
		error(JSON.stringify(apiError), 'HTP_FUN');

		if (apiError.error)
			throw new SpiceCraftError(Errors.mojangApi.couldNotConnectToApi);
		throw new SpiceCraftError(Errors.mojangApi.noMojangAccountWithThatUsername);
	}
}

export async function getUsernameFromUuid(uuid: string): Promise<string> {
	try {
		const response = await axios.get(`${mojangApiUrl}/user/profile/${uuid}`);
		return response.data.name;
	}
	catch (e) {
		error(JSON.stringify(e.response.data), 'HTP_FID');

		if (e.response.status === 400)
			throw new SpiceCraftError(Errors.mojangApi.noMojangAccountWithThatUuid);
		throw new SpiceCraftError(Errors.mojangApi.couldNotConnectToApi);
	}
}