import { Client, GatewayIntentBits } from "discord.js";
import * as Models from './models'

export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] }) as Models.ClientWithCommands;

// structuredClone dosen't work in some circumstances
export function deepCloneWithJson(objectToClone: any): any {
	return JSON.parse(JSON.stringify(objectToClone));
}

// TODO Try send