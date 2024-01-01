import {Client, Collection, Guild, GuildMember, Interaction} from "discord.js";
import * as DatabaseService from './services/database';
import * as RconService from './services/rcon';
import * as Utils from './utils';
import {RawGuildMemberData} from "discord.js/typings/rawDataTypes";

export interface ClientWithCommands extends Client {
    commands: Collection<string, any>;
}

export type InteractionWithCommands = Interaction & {
    client: ClientWithCommands;
}

export interface UserFromMojangApi {
    id: string;
    name: string;
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

    // Remplacer par isServerMember()
    async fetchGuildMember(guild: Guild): Promise<GuildMember> {
        return await Utils.fetchGuildMember(guild, this.discord_uuid);
    }

//    async sendMessage(todo) {
//        if (!this.member) this.member = await this.fetchGuildMember(guild);
//        this.member.send(todo)
//    }
//
//    async isMemberOfServer() {
//
//    }
//
//    async addPlayerRole(guild: Guild) {
//        if (!this.member) this.member = await this.fetchGuildMember(guild);
//        const role = await Utils.fetchPlayerRole(guild);
//        await this.member.roles.add(role);
//    }
//
//    async removePlayerRole(guild: Guild) {
//        if (!this.member) this.member = await this.fetchGuildMember(guild);
//        const role = await Utils.fetchPlayerRole(guild);
//        await this.member.roles.remove(role);
//    }
}

export interface MojangApiError {
    path: string;
    error: string;
    errorMessage: string;
}