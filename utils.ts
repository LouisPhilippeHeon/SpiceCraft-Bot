import { Client, GatewayIntentBits } from "discord.js";
import * as Constants from "./bot-constants";

export const client: any = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });

// structuredClone dosen't work in some circumstances
export function deepCloneWithJson(objectToClone: any): any {
	return JSON.parse(JSON.stringify(objectToClone));
}

// TODO Move to texts
export function statusToText(statusCode: number): string {
	if (statusCode == Constants.inscriptionStatus.awaitingApproval) return 'en attente';
	if (statusCode == Constants.inscriptionStatus.approved) return 'approuvés';
	if (statusCode == Constants.inscriptionStatus.rejected) return 'rejetés';
}

export function statusToEmoji(statusCode: number): string {
	if (statusCode == Constants.inscriptionStatus.awaitingApproval) return '🕓';
	if (statusCode == Constants.inscriptionStatus.approved) return '✅';
	if (statusCode == Constants.inscriptionStatus.rejected) return '❌';
}