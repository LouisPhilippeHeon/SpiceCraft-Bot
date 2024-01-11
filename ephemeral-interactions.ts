import { ButtonInteraction } from 'discord.js';

// Ephemeral messages cannot be fetched, therefore the reference must be kept
export const ephemeralInteractions = new Map<string, ButtonInteraction>();