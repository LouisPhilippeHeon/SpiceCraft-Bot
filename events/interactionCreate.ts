import * as assert from 'assert';
import { Events } from 'discord.js';
import { error } from '../services/logger';
import { InteractionWithCommands } from '../models';
import { Errors } from '../strings';
import { replyOrFollowUp, template } from '../utils';

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: InteractionWithCommands) {
		if (interaction.isButton())
			await handleButtonInteraction(interaction);

		else if (interaction.isChatInputCommand())
			await handleChatInputCommand(interaction);
	}
}

async function handleButtonInteraction(interaction: InteractionWithCommands) {
	if (!interaction.isButton()) return;

	const buttonName = interaction.customId.split('_')[0];
	const member = interaction.guild.members.resolve(interaction.user);
	const button = interaction.client.buttons.get(buttonName);

	if (!button) {
		error(template(Errors.interaction.buttonNotFound, {button: interaction.customId}));
		return;
	}

	try {
		assert(member);
		if (button.data.permissions)
			assert(member.permissions.has(button.data.permissions));

		await button.execute(interaction);
	}
	catch (e) {
		if (e.code === 'ERR_ASSERTION') await replyOrFollowUp({ content: Errors.interaction.unauthorized, ephemeral: true }, interaction);
		else {
			error(e);
			await replyOrFollowUp({ content: Errors.interaction.buttonExecution, ephemeral: true }, interaction);
		}
	}
}

async function handleChatInputCommand(interaction: InteractionWithCommands) {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		error(template(Errors.interaction.commandNotFound, {command: interaction.commandName}));
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (e) {
		error(e);
		await replyOrFollowUp({content: Errors.interaction.commandExecution, ephemeral: true}, interaction);
	}
}