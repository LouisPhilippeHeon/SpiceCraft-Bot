import { Client, Collection } from 'discord.js';

export interface ClientWithCommands extends Client {
	commands: Collection<string, any>;
	buttons: Collection<string, any>;
}