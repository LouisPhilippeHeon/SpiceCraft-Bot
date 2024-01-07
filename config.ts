import { Rcon } from 'rcon-client';

export const token: string = 'aHR0cHM6Ly9pLmt5bS1jZG4uY29tL3Bob3Rvcy9pbWFnZXMvb3JpZ2luYWwvMDAxLzY5My8zOTUvOTc0LnBuZw==';
export const clientId: string = 'YWRlcHRDb250ZW50LnppcA==';
export const guildId: string = 'dGEgbcOocmUgZXN0IGdyb3NzZQ==';

export const rconConnexions: Rcon[] = [
	new Rcon({ host: '10.0.0.100', port: 420, password: 'U0VSSVNFVA==' }),
	new Rcon({ host: '10.0.0.100', port: 69, password: 'U0VSSVNFVA==' })
]