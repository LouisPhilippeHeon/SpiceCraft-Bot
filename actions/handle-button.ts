import { inscriptionStatus } from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Constants from '../bot-constants';
import * as Texts from '../texts';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, User } from 'discord.js';

export async function approveUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.approved);

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		await interaction.message.edit({ content: Texts.events.approbation.requestGranted, embeds: [embedToUpdate], components: [] });

		interaction.guild.members.fetch(discordUuid).then(async member => {
			let role = await Utils.fetchPlayerRole(interaction.guild);

			await member.roles.add(role);
			try {
				await member.send(Texts.events.approbation.messageSentToPlayerToConfirmInscription);
				await interaction.reply({ content: Texts.events.approbation.successReply.replace('$discordUuid$', discordUuid), ephemeral: true });
			}
			catch {
				await interaction.reply(Texts.errors.cantSendMessageToUser);
			}
		}).catch(async () => {
			await interaction.reply(Texts.errors.noDiscordUserWithThisUuid);
		});
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function rejectUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];

		const confirmRejection = new ButtonBuilder()
			.setCustomId(`confirm-reject-${discordUuid}-${interaction.message.id}`)
			.setLabel(Texts.embeds.components.reject)
			.setStyle(ButtonStyle.Danger);
		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel(Texts.embeds.components.cancel)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
		await interaction.reply({ content: Texts.events.rejection.askConfirmation.replace('$discordUuid$', discordUuid), components: [row] });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function confirmRejectUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[2];
		const messageUuid = interaction.customId.split('-')[3];

		await interaction.message.delete();
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.rejected);

		const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
		const approvalRequest = await whitelistChannel.messages.fetch(messageUuid);

		if (approvalRequest !== undefined) {
			const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
			embedToUpdate.color = Colors.Red;
			await approvalRequest.edit({ content: Texts.events.rejection.requestDenied, embeds: [embedToUpdate], components: [] });
		}

		Utils.client.users.fetch(discordUuid).then(async (user: User) => {
			try {
				user.send(Texts.events.rejection.messageSentToUserToInformRejection);
				await interaction.reply({ content: Texts.events.rejection.informedUserAboutRejection.replace('$discordUuid$', discordUuid), ephemeral: true });
			}
			catch {
				await interaction.reply(Texts.errors.cantSendMessageToUser);
			}
		}).catch(async () => {
			await interaction.reply(Texts.errors.noDiscordUserWithThisUuid);
		});
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function confirmUsernameChange(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		const minecraftUuid = interaction.customId.split('-')[2];

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		try {
			await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);
		}
		catch (e) {
			if (e.name == 'SequelizeUniqueConstraintError') {
				await interaction.reply(Texts.errors.usernameUsedWithAnotherAccount);
				return;
			}
			await interaction.reply(Texts.errors.database.unknownError);
		}

		await interaction.message.edit({ content: Texts.events.usernameChangeConfirmation.messageUpdate, embeds: [embedToUpdate], components: [] });

		Utils.client.users.fetch(discordUuid).then(async user => {
			try {
				await user.send(Texts.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange);
				await interaction.reply({ content: Texts.events.usernameChangeConfirmation.informedUserAboutUpdate, ephemeral: true });
			}
			catch {
				await interaction.reply(Texts.errors.cantSendMessageToUser);
			}
		}).catch(async () => {
			await interaction.reply(Texts.errors.noDiscordUserWithThisUuid);
		});
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function deleteUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.deleteEntry(discordUuid);

		const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
		embedToUpdate.color = Colors.Red;
		await interaction.message.edit({ content: Texts.commands.deleteEntry.messageUpdate, embeds: [embedToUpdate], components: [] });
		await interaction.reply({ content: Texts.commands.deleteEntry.reply, ephemeral: true });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function confirmEndSeason(interaction: ButtonInteraction) {
	try {
		await interaction.message.edit({ content: Texts.commands.endSeason.seasonEnded, components: [] });

		// Sending the data about to be deleted to the user performing the command
		const users = await DatabaseService.getUsers();
		if (users.length > 0) {
			await (await Utils.client.users.fetch(interaction.member.user.id)).send({
				files: [{
					attachment: Buffer.from(JSON.stringify(users)),
					name: Constants.filenameSeasonSave
				}]
			}).catch(async () =>
				// People using this commands are admins, therefore they should have their DMs turned on for the server anyways
				console.log(JSON.stringify(await DatabaseService.getUsers()))
			);
		}

		await interaction.reply({ content: Texts.commands.endSeason.newSeasonBegins, ephemeral: true });
		DatabaseService.tags.sync({ force: true });
		await (await Utils.fetchPlayerRole(interaction.guild)).delete();

		// Not calling fetchBotChannel to avoid creating a channel if it is already deleted
		const botChannel = interaction.guild.channels.cache.find(channel => channel.name === Constants.whitelistChannelName);
		if (botChannel) await botChannel.delete();
	}
	catch {
		await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
	}
}