import { Client, Collection, Interaction } from "discord.js";

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

export interface UserFromDb {
    id: number;
    discord_uuid: string;
    minecraft_uuid: string;
    inscription_status: number;
    created_at: Date;
    update_at: Date;
}

export interface MojangApiError {
    path: string;
    error: string;
    errorMessage: string;
}