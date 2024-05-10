import { ClientWithCommands } from './client-with-commands';
import { Interaction } from 'discord.js';

export type InteractionWithCommands = Interaction & {
	client: ClientWithCommands;
}