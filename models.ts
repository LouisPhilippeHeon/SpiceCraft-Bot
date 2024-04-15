import { inscriptionStatus } from './bot-constants';
import { changeMinecraftUuid, changeStatus, deleteEntry } from './services/database';
import { Client, Collection, Guild, GuildMember, Interaction } from 'discord.js';
import { whitelistAdd, whitelistRemove, whitelistReplaceUsername } from './services/rcon';
import { fetchGuildMember } from './utils';

export interface ClientWithCommands extends Client {
	commands: Collection<string, any>;
	buttons: Collection<string, any>;
}

export type InteractionWithCommands = Interaction & {
	client: ClientWithCommands;
}

export class UserFromMojangApi {
	id: string;
	name: string;
}

export class ButtonData {
	name: string;
	permissions: BigInt;

	constructor(name: string, permisions?: BigInt) {
		this.name = name;
		this.permissions = permisions;
	}
}

export class UserFromDb {
	readonly id: number;
	readonly discord_uuid: string;
	readonly minecraft_uuid: string;
	readonly inscription_status: number;
	readonly createdAt: Date;
	readonly updatedAt: Date;

	async delete() {
		await deleteEntry(this.discord_uuid);
	}

	async addToWhitelist() {
		await whitelistAdd(this.minecraft_uuid);
	}

	async removeFromWhitelist() {
		await whitelistRemove(this.minecraft_uuid);
	}

	async replaceWhitelistUsername(newUuid: string) {
		await whitelistReplaceUsername(newUuid, this.minecraft_uuid);
	}

	async changeStatus(newStatus: number) {
		await changeStatus(this.discord_uuid, newStatus);
	}

	async editMinecraftUuid(newUuid: string) {
		await changeMinecraftUuid(this.discord_uuid, newUuid);
	}

	async fetchGuildMember(guild: Guild): Promise<GuildMember> {
		return await fetchGuildMember(guild, this.discord_uuid);
	}

	isAwaitingApproval(): boolean {
		return this.inscription_status === inscriptionStatus.awaitingApproval;
	}

	isRejected(): boolean {
		return this.inscription_status === inscriptionStatus.rejected;
	}
}