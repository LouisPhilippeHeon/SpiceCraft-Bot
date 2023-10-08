import { inscriptionStatus } from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils';
import * as Constants from '../bot-constants';
import * as Texts from '../texts'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, User } from 'discord.js';

const requestGranted = '✅ La demande a été approuvée.';
const requestDenied = '❌ La demande a été rejetée.';
const addedText = 'Tu a été ajouté à la whitelist. Si tu n\'arrive pas à te connecter, ton username Minecraft est peut-être incorrect. Si c\'est le cas, clique à nouveau sur le bouton d\'inscription.';
const rejectedText = 'Désolé, mais les administrateurs ont choisi de ne pas t\'ajouter à la whitelist. Contacte-les pour plus de détails.';
const noDiscordUserWithThisUuidText = 'Cet utilisateur Discord n\'est pas membre du serveur.';

export async function approveUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.approved);

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		await interaction.message.edit({ content: requestGranted, embeds: [embedToUpdate], components: [] });

		interaction.guild.members.fetch(discordUuid).then(async member => {
			let role = await Utils.fetchPlayerRole(interaction.guild);

			await member.roles.add(role);
			try {
				await member.send(addedText);
				await interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer de son ajout à la whitelist.`, ephemeral: true });
			}
			catch {
				await interaction.reply('Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité.');
			}
		}).catch(async () => {
			await interaction.reply(noDiscordUserWithThisUuidText);
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
			.setLabel('Rejeter')
			.setStyle(ButtonStyle.Danger);
		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Annuler')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmRejection, cancel);
		await interaction.reply({ content: `Êtes vous certain de vouloir rejeter <@${discordUuid}> ?`, components: [row] });
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
			await approvalRequest.edit({ content: requestDenied, embeds: [embedToUpdate], components: [] });
		}

		Utils.client.users.fetch(discordUuid).then(async (user: User) => {
			try {
				user.send(rejectedText);
				await interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer du rejet.`, ephemeral: true });
			}
			catch {
				await interaction.reply('Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité.');
			}
		}).catch(async () => {
			await interaction.reply(noDiscordUserWithThisUuidText);
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

		await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		await interaction.message.edit({ content: '✅ La mise à jour de username a été complétée.', embeds: [embedToUpdate], components: [] });

		Utils.client.users.fetch(discordUuid).then(async user => {
			try {
				await user.send('Ton username Minecraft a été mis à jour dans la whitelist.');
				await interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer de la mise à jour du username.`, ephemeral: true });
			}
			catch {
				await interaction.reply('Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité.');
			}
		}).catch(async () => {
			await interaction.reply(noDiscordUserWithThisUuidText);
		});
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function deleteUser(interaction: ButtonInteraction) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.deleteEntryWithDiscordUuid(discordUuid);

		const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
		embedToUpdate.color = Colors.Red;
		await interaction.message.edit({ content: '🗑️ L\'utilisateur a été supprimé de la base de données', embeds: [embedToUpdate], components: [] });
		await interaction.reply({ content: 'L\'utilisateur a été supprimé de la base de données.', ephemeral: true });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function confirmEndSeason(interaction: ButtonInteraction) {
	try {
		await interaction.message.edit({ content: 'La saison a pris fin !', components: [] });

		// Sending the data about to be deleted to the user performing the command
		const users = await DatabaseService.getUsers();
		if (users.length > 0) {
			await (await Utils.client.users.fetch(interaction.member.user.id)).send({
				files: [{
					attachment: Buffer.from(JSON.stringify(users)),
					name: 'sauvegarde_saison.json'
				}]
			}).catch(async () =>
				// People using this commands are admins, therefore they should have their DMs turned on for the server anyways
				console.log(JSON.stringify(await DatabaseService.getUsers()))
			);
		}

		await interaction.reply({ content: 'Nouvelle saison !', ephemeral: true });
		DatabaseService.tags.sync({ force: true });
		await (await Utils.fetchPlayerRole(interaction.guild)).delete();

		// Not calling fetchBotChannel to avoid creating a channel if it is already deleted
		const botChannel = interaction.guild.channels.cache.find(channel => channel.name === Constants.whitelistChannelName);
		if (botChannel) await botChannel.delete();
	}
	catch {
		await interaction.reply({ content: 'Une erreur est survenue !', ephemeral: true });
	}
}