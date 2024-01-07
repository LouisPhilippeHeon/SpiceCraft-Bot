import * as Models from '../models';
import * as Strings from '../strings';
import * as assert from 'assert';
import { Events, ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { manuallyModifiedWhitelist } from '../buttons/manually-modified-whitelist';
import { approveUser } from '../buttons/approve';
import { confirmEndSeason } from '../buttons/confirm-end-season';
import { confirmRejectUser } from '../buttons/confirm-reject';
import { rejectUser } from '../buttons/reject';
import { manuallyAddedToWhitelist } from '../buttons/manually-added-whitelist';
import { ban } from '../buttons/ban';
import { confirmUsernameChange } from '../buttons/update';
import { deleteUser } from '../buttons/delete';
import { inscription } from '../buttons/inscription';
import { register } from '../buttons/register';
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

async function handleButtonInteraction(interaction: ButtonInteraction) {
	const command = interaction.customId.split('_')[0];
	const member = interaction.guild.members.resolve(interaction.user);
	try {
		assert(member);
		switch (command) {
			case 'inscription':
				await inscription(interaction);
				break;
			case 'dissmiss':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await interaction.message.delete();
				break;
			case 'confirm-end-season':
				assert(member.permissions.has(PermissionFlagsBits.Administrator));
				await confirmEndSeason(interaction);
				break;
			case 'register':
				await register(interaction);
				break;
			case 'confirm-reject':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await confirmRejectUser(interaction);
				break;
			case 'approve':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await approveUser(interaction);
				break;
			case 'reject':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await rejectUser(interaction);
				break;
			case 'update':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await confirmUsernameChange(interaction);
				break;
			case 'delete':
				assert(member.permissions.has(PermissionFlagsBits.Administrator));
				await deleteUser(interaction);
				break;
			case 'manually-added-whitelist':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await manuallyAddedToWhitelist(interaction);
				break;
			case 'manually-modified-whitelist':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await manuallyModifiedWhitelist(interaction);
				break;
			case 'ban':
				assert(member.permissions.has(PermissionFlagsBits.BanMembers));
				await ban(interaction);
				break;
		}
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