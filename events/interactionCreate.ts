import { Events } from 'discord.js';
import * as RegisteringService from '../services/registering';
import * as Models from '../models';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Constants from '../bot-constants';
import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, Message } from 'discord.js';

const erreurCommandeText = 'Une erreur s\'est produite lors de l\'exécution de cette commande!';

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Models.InteractionWithCommands) {
		if (interaction.isButton()) {
			try {
				if (interaction.customId === 'inscription') await inscription(interaction);
				if (interaction.customId === 'dissmiss') await interaction.message.delete();
				if (interaction.customId === 'confirm-new-season') await confirmEndSeason(interaction);
				if (interaction.customId.startsWith('confirm-reject')) await confirmRejectUser(interaction);
				if (interaction.customId.startsWith('approve')) await approveUser(interaction);
				if (interaction.customId.startsWith('reject')) await rejectUser(interaction);
				if (interaction.customId.startsWith('update')) await confirmUsernameChange(interaction);
				if (interaction.customId.startsWith('delete')) await deleteUser(interaction);
			}
			catch (e) {
				await interaction.reply({ content: e.message, ephemeral: true });
				console.error(e.message);
			}
		}

		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`Aucune commande ne corresponsant à ${interaction.commandName} n'a été trouvée.`);
			return;
		}

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: erreurCommandeText, ephemeral: true });
			}
			else {
				await interaction.reply({ content: erreurCommandeText, ephemeral: true });
			}
		}
	}
}

export async function approveUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('-')[1];
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

export async function rejectUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('-')[1];

	const confirmRejection = new ButtonBuilder()
		.setCustomId(`confirm-reject-${discordUuid}-${interaction.message.id}`)
		.setLabel(Strings.embeds.components.reject)
		.setStyle(ButtonStyle.Danger);
	const cancel = new ButtonBuilder()
		.setCustomId('dissmiss')
		.setLabel(Strings.embeds.components.cancel)
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
	await interaction.reply({ content: Strings.events.rejection.askConfirmation.replace('$discordUuid$', discordUuid), components: [row] });
}

async function confirmRejectUser(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('-')[2];
	const messageUuid = interaction.customId.split('-')[3];

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
	const discordUuid = interaction.customId.split('-')[1];
	const minecraftUuid = interaction.customId.split('-')[2];

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
	const discordUuid = interaction.customId.split('-')[1];
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

export async function inscription(interaction: ButtonInteraction) {
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
			await RegisteringService.registerNewUser(interaction).catch(async () => await interaction.reply({ content: Strings.services.registering.dmsAreClosed, ephemeral: true }));
			return;
		}
		await interaction.reply(Strings.errors.generic);
	}
}