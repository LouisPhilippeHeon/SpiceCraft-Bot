import * as RegisteringService from '../services/registering';
import * as Models from '../models';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Constants from '../bot-constants';
import * as Strings from '../strings';
import { ButtonComponent, Events, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, Message, PermissionFlagsBits } from 'discord.js';
import * as assert from "assert";
import * as RconService from '../services/rcon';
import * as HttpService from '../services/http';

// Ephemeral messages cannot be fetched, therefore the reference must be kept
const ephemeralInteractions = new Map<string, ButtonInteraction>();

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Models.InteractionWithCommands) {
		if (interaction.isButton())
			handleButtonInteraction(interaction);

		else if (interaction.isChatInputCommand())
			handleChatInputCommand(interaction);
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

async function approveUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.approved);

	const approvalRequest = interaction.message;
	const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
	embedToUpdate.color = Colors.Green;

	let member;
	try {
		member = await interaction.guild.members.fetch(discordUuid);
	}
	catch {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid);
		await interaction.message.delete();
		return;
	}

	let role = await Utils.fetchPlayerRole(interaction.guild);

	await member.roles.add(role);
	await interaction.message.edit({ content: Strings.events.approbation.requestGranted, embeds: [embedToUpdate], components: [] });

	try {
		const user = await DatabaseService.getUserByDiscordUuid(discordUuid);
		const username = await HttpService.getUsernameFromUuid(user.minecraft_uuid);
		RconService.whitelistAdd(username);
	}
	catch {
		// TODO Could not automatically add player to whitelist. click here once added manually
		// TODO Create embed
	}

	try {
		await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
		await interaction.reply({ content: Strings.events.approbation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
	catch {
		await interaction.reply({ content: Strings.events.approbation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
}

async function rejectUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	const confirmRejection = new ButtonBuilder({
		customId: `confirm-reject_${discordUuid}_${interaction.message.id}`,
		label: Strings.components.buttons.reject,
		style: ButtonStyle.Danger
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: Strings.components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
	await interaction.reply({ content: Strings.events.rejection.askConfirmation.replace('$discordUuid$', discordUuid), components: [row] });
}

async function confirmRejectUser(interaction: ButtonInteraction) {
	// TODO Remove from whitelist
	const discordUuid = interaction.customId.split('_')[1];
	const messageUuid = interaction.customId.split('_')[2];

	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	let approvalRequest: Message;

	approvalRequest = await whitelistChannel.messages.fetch(messageUuid).catch(() => approvalRequest = undefined);

	await interaction.message.delete();
	await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.rejected);

	let member;
	try {
		member = await interaction.guild.members.fetch(discordUuid);
	}
	catch (e) {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid + '\n' + Strings.events.rejection.userStillInBdExplanation);
		if (approvalRequest !== undefined) await approvalRequest.delete();
		return;
	}

	if (approvalRequest !== undefined) {
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Red;
		await approvalRequest.edit({ content: Strings.events.rejection.requestDenied, embeds: [embedToUpdate], components: [] });
	}

	try {
		await member.send(Strings.events.rejection.messageSentToUserToInformRejection);
		await interaction.reply({ content: Strings.events.rejection.success.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
	catch {
		await interaction.reply({ content: Strings.events.rejection.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
}

async function confirmUsernameChange(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];
	let member;

	// TODO Remove old username and add new one in whitelist using RCON

	try {
		member = await interaction.guild.members.fetch(discordUuid);
	}
	catch (e) {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid);
		await interaction.message.delete();
		return;
	}

	try {
		await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);
	}
	catch (e) {
		await interaction.reply(e);
	}

	const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
	embedToUpdate.color = Colors.Green;
	await interaction.message.edit({ content: Strings.events.usernameChangeConfirmation.messageUpdate, embeds: [embedToUpdate], components: [] });

	try {
		await member.send(Strings.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange);
		await interaction.reply({ content: Strings.events.usernameChangeConfirmation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
	catch {
		await interaction.reply({ content: Strings.events.usernameChangeConfirmation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
	}
}

async function deleteUser(interaction: ButtonInteraction) {
	// TODO Remove from whitelist
	await interaction.message.delete();
	const discordUuid = interaction.customId.split('_')[1];
	await DatabaseService.deleteEntry(discordUuid);
	const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
	embedToUpdate.color = Colors.Red;
	await interaction.message.edit({ content: Strings.commands.deleteEntry.messageUpdate, embeds: [embedToUpdate], components: [] });
	await interaction.reply({ content: Strings.commands.deleteEntry.reply, ephemeral: true });
}

async function confirmEndSeason(interaction: ButtonInteraction) {
	await interaction.message.edit({ content: Strings.commands.endSeason.seasonEnded, components: [] });

	// Sending the data about to be deleted to the user performing the command
	const users = await DatabaseService.getUsers();
	if (users.length > 0) {
		await interaction.user.send({
			files: [{
				attachment: Buffer.from(JSON.stringify(users)),
				name: Constants.filenameSeasonSave
			}]
		}).catch(async () =>
			// People using this commands are admins, therefore they should have their DMs turned on for the server anyways
			console.log(JSON.stringify(await DatabaseService.getUsers()))
		);
	}

	await interaction.reply({ content: Strings.commands.endSeason.newSeasonBegins, ephemeral: true });
	DatabaseService.tags.sync({ force: true });
	await (await Utils.fetchPlayerRole(interaction.guild)).delete();

	// Not calling fetchBotChannel to avoid creating a channel if it is already deleted
	const botChannel = interaction.guild.channels.cache.find(channel => channel.name === Constants.whitelistChannelName);
	if (botChannel) await botChannel.delete();
}

async function inscription(interaction: ButtonInteraction) {
	let discordUuid = interaction.user.id;
	const userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

	if (userFromDb) {
		if (userFromDb.inscription_status === Constants.inscriptionStatus.rejected)
			await interaction.reply({ content: Strings.services.registering.adminsAlreadyDeniedRequest, ephemeral: true });
		else
			await RegisteringService.updateExistingUser(userFromDb, interaction);
	}
	else
		await askIfFistTimeUser(interaction);
}

async function askIfFistTimeUser(interaction: ButtonInteraction) {
	// Avoid having mutiple of these messages, because it means user could go to register process multiple times
	if (ephemeralInteractions.get(interaction.user.id)) {
		await (ephemeralInteractions.get(interaction.user.id).deleteReply());
		ephemeralInteractions.delete(interaction.user.id);
	}

	const firstTime = new ButtonBuilder({
		customId: 'register-not-first-time',
		label: Strings.components.buttons.yes,
		style: ButtonStyle.Secondary
	});

	const notFirstTime = new ButtonBuilder({
		customId: 'register-first-time',
		label: Strings.components.buttons.no,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstTime, notFirstTime);
	await interaction.reply(({ content: Strings.events.register.askIfFirstTimePlaying, components: [row], ephemeral: true }));

	ephemeralInteractions.set(interaction.user.id, interaction);
}

async function register(interaction: ButtonInteraction) {
	const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

	// Disable buttons and style the one that was clicked
	if (interactionWithEphemeral) {
		let components = (await interactionWithEphemeral.fetchReply()).components[0].components;
		const row = new ActionRowBuilder<ButtonBuilder>();

		components.forEach((component: ButtonComponent) => {
			const wasClicked = component.customId === interaction.customId;

			const newComponent = new ButtonBuilder({
				customId: component.customId,
				label: component.label,
				style: (wasClicked) ? ButtonStyle.Primary : component.style,
				disabled: true
			});

			row.addComponents(newComponent);
		});
		await interactionWithEphemeral.editReply({ components: [row] })
	}

	ephemeralInteractions.delete(interaction.user.id);
	await RegisteringService.registerUser(interaction, (interaction.customId === 'register-first-time'));
}