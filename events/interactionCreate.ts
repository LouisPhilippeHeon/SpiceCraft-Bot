import * as RegisteringService from '../services/registering';
import * as Models from '../models';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Constants from '../bot-constants';
import * as Strings from '../strings';
import { ButtonComponent, Events, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, Message } from 'discord.js';

// Ephemeral messages cannot be fetched, therefore the reference must be kept
const ephemeralInteractions = new Map<string, ButtonInteraction>();

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Models.InteractionWithCommands) {
		if (interaction.isButton()) {
			try {
				// TODO Validate permissions, unauthorized user could tamper with requests
				if (interaction.customId === 'inscription') await inscription(interaction);
				if (interaction.customId === 'dissmiss') await interaction.message.delete();
				if (interaction.customId === 'confirm-new-season') await confirmEndSeason(interaction);
				if (interaction.customId === 'register-first-time' || interaction.customId === 'register-not-first-time') await register(interaction);
				if (interaction.customId.startsWith('confirm-reject')) await confirmRejectUser(interaction);
				if (interaction.customId.startsWith('approve')) await approveUser(interaction);
				if (interaction.customId.startsWith('reject')) await rejectUser(interaction);
				if (interaction.customId.startsWith('update')) await confirmUsernameChange(interaction);
				if (interaction.customId.startsWith('delete')) await deleteUser(interaction);
			}
			catch (e) {
				console.error(e);
				if (!interaction.replied) await interaction.reply({ content: e.message, ephemeral: true });
			}
		}

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
}

async function approveUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.approved);

	const approvalRequest = interaction.message;
	const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
	embedToUpdate.color = Colors.Green;

	interaction.guild.members.fetch(discordUuid).then(async member => {
		let role = await Utils.fetchPlayerRole(interaction.guild);

		await member.roles.add(role);
		try {
			await member.send(Strings.events.approbation.messageSentToPlayerToConfirmInscription);
			await interaction.message.edit({ content: Strings.events.approbation.requestGranted, embeds: [embedToUpdate], components: [] });
			await interaction.reply({ content: Strings.events.approbation.successReply.replace('$discordUuid$', discordUuid), ephemeral: true });
		}
		catch {
			await interaction.reply(Strings.errors.cantSendMessageToUser);
		}
	}).catch(async () => {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid);
		await interaction.message.delete();
	});
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
	const discordUuid = interaction.customId.split('_')[1];
	const messageUuid = interaction.customId.split('_')[2];

	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	let approvalRequest: Message;

	approvalRequest = await whitelistChannel.messages.fetch(messageUuid).catch(() => approvalRequest = undefined);

	await interaction.message.delete();
	await DatabaseService.changeStatus(discordUuid, Constants.inscriptionStatus.rejected);

	interaction.guild.members.fetch(discordUuid).then(async member => {
		try {
			await member.send(Strings.events.rejection.messageSentToUserToInformRejection);
			await interaction.reply({ content: Strings.events.rejection.informedUserAboutRejection.replace('$discordUuid$', discordUuid), ephemeral: true });

			if (approvalRequest !== undefined) {
				const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
				embedToUpdate.color = Colors.Red;
				await approvalRequest.edit({ content: Strings.events.rejection.requestDenied, embeds: [embedToUpdate], components: [] });
			}
		}
		catch {
			await interaction.reply(Strings.errors.cantSendMessageToUser);
		}
	}).catch(async () => {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid + '\n' + Strings.events.rejection.userStillInBdExplanation);
		if (approvalRequest !== undefined) await approvalRequest.delete();
	});
}

async function confirmUsernameChange(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];

	const approvalRequest = interaction.message;
	const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
	embedToUpdate.color = Colors.Green;

	try {
		await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);
	}
	catch (e) {
		if (e.name === 'SequelizeUniqueConstraintError') {
			await interaction.reply(Strings.errors.usernameUsedWithAnotherAccount);
			return;
		}
		await interaction.reply(Strings.errors.database.unknownError);
	}

	await interaction.message.edit({ content: Strings.events.usernameChangeConfirmation.messageUpdate, embeds: [embedToUpdate], components: [] });

	interaction.guild.members.fetch(discordUuid).then(async member => {
		try {
			await member.send(Strings.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange);
			await interaction.reply({ content: Strings.events.usernameChangeConfirmation.informedUserAboutUpdate.replace('$discordUuid$', discordUuid), ephemeral: true });
		}
		catch {
			await interaction.reply(Strings.errors.cantSendMessageToUser);
		}
	}).catch(async () => {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid);
	});
}

async function deleteUser(interaction: ButtonInteraction) {
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

	try {
		const userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

		if (userFromDb.inscription_status === Constants.inscriptionStatus.rejected) {
			await interaction.reply({ content: Strings.services.registering.adminsAlreadyDeniedRequest, ephemeral: true });
			return;
		}

		await RegisteringService.updateExistingUser(userFromDb, interaction).catch(async () => {
			await interaction.reply({ content: Strings.services.registering.dmsAreClosed, ephemeral: true });
		});
	}
	// User does not exist in the database and should be created
	catch (e) {
		if (e.message === Strings.errors.database.userDoesNotExist) {
			try {
				await askIfFistTimeUser(interaction);
				ephemeralInteractions.set(interaction.user.id, interaction)
			}
			catch (e) {
				console.error(e.message);
			}
			return;
		}
		await interaction.reply(Strings.errors.generic);
	}
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
	await interaction.reply(({ content: 'As-tu déjà joué sur SpiceCraft ?', components: [row], ephemeral: true }));
}

async function register(interaction: ButtonInteraction) {
	const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

	if (interactionWithEphemeral) {
		let components = (await interactionWithEphemeral.fetchReply()).components[0].components;
		const row = new ActionRowBuilder<ButtonBuilder>();

		// Disable buttons and style the one that was clicked
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
		await interactionWithEphemeral.editReply({components: [row]})
	}

	ephemeralInteractions.delete(interaction.user.id);

	if (interaction.customId === 'register-first-time') {
		await interaction.reply({ content: Strings.services.registering.messageSentInDmsNewUser, ephemeral: true });
		await RegisteringService.registerUser(interaction, true);
	}
	else {
		await interaction.reply({ content: Strings.services.registering.messageSentInDms, ephemeral: true });
		await RegisteringService.registerUser(interaction, false);
	}
}