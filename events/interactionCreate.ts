import * as Models from '../models';
import * as Strings from '../strings';
import * as assert from 'assert';
import { Events, ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { manuallyModifiedWhitelist } from '../buttonEvents/manually-modified-whitelist';
import { approveUser } from '../buttonEvents/approve';
import { confirmEndSeason } from '../buttonEvents/confirm-new-season';
import { confirmRejectUser } from '../buttonEvents/confirm-reject';
import { rejectUser } from '../buttonEvents/reject';
import { manuallyAddedToWhitelist } from '../buttonEvents/manually-added-whitelist';
import { ban } from '../buttonEvents/ban';
import { confirmUsernameChange } from '../buttonEvents/update';
import { deleteUser } from '../buttonEvents/delete';
import { inscription } from '../buttonEvents/inscription';
import { register } from '../buttonEvents/register';

// Ephemeral messages cannot be fetched, therefore the reference must be kept
export const ephemeralInteractions = new Map<string, ButtonInteraction>();

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
			case 'confirm-new-season':
				assert(member.permissions.has(PermissionFlagsBits.Administrator));
				await confirmEndSeason(interaction);
				break;
			case 'register-first-time':
			case 'register-not-first-time':
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
		if (e.code === 'ERR_ASSERTION') {
			if (!interaction.replied) await interaction.reply({ content: Strings.errors.unauthorized, ephemeral: true });
			return;
		}

		console.error(e);
		if (!interaction.replied) await interaction.reply({ content: Strings.errors.generic, ephemeral: true });
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

		if (interaction.replied || interaction.deferred)
			await interaction.followUp({ content: Strings.errors.commandExecution, ephemeral: true });
		else
			await interaction.reply({ content: Strings.errors.commandExecution, ephemeral: true });
	}
}