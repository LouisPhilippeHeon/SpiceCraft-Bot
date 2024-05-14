import * as assert from 'assert';
import { ButtonInteraction, Events } from 'discord.js';
import { SpiceCraftError } from '../models/error';
import { handleError } from '../services/error-handler';
import { error } from '../services/logger';
import { InteractionWithCommands } from '../models/interaction-with-commands';
import { Errors } from '../strings';
import { template } from '../utils';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: InteractionWithCommands) {
	if (interaction.isButton())
		await handleButtonInteraction(interaction);

	else if (interaction.isChatInputCommand())
		await handleChatInputCommand(interaction);
}

async function handleButtonInteraction(interaction: InteractionWithCommands) {
	if (!interaction.isButton() || !(interaction as ButtonInteraction).inGuild()) return;

	const buttonName = interaction.customId.split('_')[0];
	const button = interaction.client.buttons.get(buttonName);
	const member = interaction.guild.members.resolve(interaction.user);

	if (!button) {
		error(template(Errors.interaction.buttonNotFound, {button: interaction.customId}), 'BTN_NOR');
		return;
	}

	try {
		assert(member, new SpiceCraftError(Errors.interaction.unauthorized));
		if (button.data.permissions)
			assert(member.permissions.has(button.data.permissions));

		await button.execute(interaction);
	}
	catch (e) {
		await handleError(e, button.data.name, interaction, Errors.interaction.buttonExecution);
	}
}

async function handleChatInputCommand(interaction: InteractionWithCommands) {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		error(template(Errors.interaction.commandNotFound, {command: interaction.commandName}), 'CMD_NOR');
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (e) {
		await handleError(e, interaction.commandName, interaction, Errors.interaction.commandExecution);
	}
}