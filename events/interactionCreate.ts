import * as assert from 'assert';
import { ButtonInteraction, Events, MessageFlags } from 'discord.js';
import { error } from '../services/logger';
import { InteractionWithCommands } from '../models';
import { Errors } from '../strings';
import { replyOrFollowUp, template } from '../utils';

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
		assert(member);
		if (button.data.permissions)
			assert(member.permissions.has(button.data.permissions));

		await button.execute(interaction);
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') await replyOrFollowUp({ content: Errors.interaction.unauthorized, flags: MessageFlags.Ephemeral }, interaction);
		else {
			error(e, 'BTN_UKN');
			await replyOrFollowUp({ content: Errors.interaction.buttonExecution, flags: MessageFlags.Ephemeral }, interaction);
		}
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
	} catch (e) {
		error(e, 'CMD_UKN');
		await replyOrFollowUp({ content: Errors.interaction.commandExecution, flags: MessageFlags.Ephemeral }, interaction);
	}
}