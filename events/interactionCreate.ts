import * as Models from '../models';
import * as Strings from '../strings';
import * as assert from 'assert';
import { Events } from 'discord.js';
import { replyOrFollowUp } from '../utils';

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Models.InteractionWithCommands) {
		if (interaction.isButton())
			await handleButtonInteraction(interaction);

		else if (interaction.isChatInputCommand())
			await handleChatInputCommand(interaction);
	}
}

async function handleButtonInteraction(interaction: Models.InteractionWithCommands) {
	if (!interaction.isButton()) return;

	const buttonName = interaction.customId.split('_')[0];
	const member = interaction.guild.members.resolve(interaction.user);
	const button = interaction.client.buttons.get(buttonName);


	if (!button) {
		console.error(Strings.errors.buttonNotFound.replace('$button$', interaction.customId));
		return;
	}

	try {
		assert(member);
		if (button.data.permissions)
			assert(member.permissions.has(button.data.permissions));

		await button.execute(interaction);
	}
	catch (e) {
		if (e.code === 'ERR_ASSERTION')	await replyOrFollowUp({ content: Strings.errors.unauthorized, ephemeral: true }, interaction);
		else {
			console.error(e);
			await replyOrFollowUp({ content: Strings.errors.generic, ephemeral: true }, interaction);
		}
	}
}

async function handleChatInputCommand(interaction: Models.InteractionWithCommands) {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(Strings.errors.commandNotFound.replace('$command$', interaction.commandName));
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await replyOrFollowUp({ content: Strings.errors.commandExecution, ephemeral: true }, interaction);
	}
}