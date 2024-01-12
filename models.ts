import { Client, Collection, Guild, GuildMember, Interaction } from 'discord.js';
import * as DatabaseService from './services/database';
import * as RconService from './services/rcon';
import * as Utils from './utils';

export interface ClientWithCommands extends Client {
    commands: Collection<string, any>;
    buttons: Collection<string, any>;
}

export type InteractionWithCommands = Interaction & {
    client: ClientWithCommands;
}

export interface UserFromMojangApi {
    id: string;
    name: string;
}

export interface MojangApiError {
    path: string;
    error: string;
    errorMessage: string;
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
        await DatabaseService.deleteEntry(this.discord_uuid);
    }

    async addToWhitelist() {
        await RconService.whitelistAdd(this.minecraft_uuid);
    }

    async removeFromWhitelist() {
        await RconService.whitelistRemove(this.minecraft_uuid);
    }

    async replaceWhitelistUsername(newUuid: string) {
        await RconService.whitelistReplaceUsername(newUuid, this.minecraft_uuid);
    }

    async changeStatus(newStatus: number) {
        await DatabaseService.changeStatus(this.discord_uuid, newStatus);
    }

    async editMinecraftUuid(newUuid: string) {
        await DatabaseService.changeMinecraftUuid(this.discord_uuid, newUuid);
    }

    async fetchGuildMember(guild: Guild): Promise<GuildMember> {
        return await Utils.fetchGuildMember(guild, this.discord_uuid);
    }
}