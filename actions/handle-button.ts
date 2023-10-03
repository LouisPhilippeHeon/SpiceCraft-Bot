import { inscriptionStatus } from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils'
import * as Constants from '../bot-constants';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from 'discord.js';

const requestGranted = '✅ La demande a été approuvée.';
const requestDenied = '❌ La demande a été rejetée.';
const addedText = 'Tu a été ajouté à la whitelist. Si tu n\'arrive pas à te connecter, ton username Minecraft est peut-être incorrect. Si c\'est le cas, clique à nouveau sur le bouton d\'inscription.';
const rejectedText = 'Désolé, mais les administrateurs ont choisi de ne pas t\'ajouter à la whitelist. Contacte-les pour plus de détails.';
const noDiscordUserWithThisUuidText = 'Cet utilisateur Discord n\'est pas membre du serveur.';

export async function approveUser(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.approved);

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		await interaction.message.edit({ content: requestGranted, embeds: [embedToUpdate], components: [] });

		interaction.guild.members.fetch(discordUuid, false).then(async (member: any) => {
			let role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
			if (!role) {
				await interaction.guild.roles.create({
					name: Constants.playerRoleName,
					color: Colors.Green,
					reason: 'Le rôle pour les joueurs n\'existait pas, il a été créé.',
				});
				role = interaction.guild.roles.cache.find((r: any) => r.name == Constants.playerRoleName);
			}

			await member.roles.add(role.id);
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

export async function rejectUser(interaction: any) {
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

		const row = new ActionRowBuilder().addComponents(confirmRejection, cancel);
		await interaction.reply({ content: `Êtes vous certain de vouloir rejeter <@${discordUuid}> ?`, components: [row] });
	}
	catch (e) {
		await interaction.reply(e.message);
	}
}

export async function confirmRejectUser(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[2];
		const messageUuid = interaction.customId.split('-')[3];

		await interaction.message.delete();
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.rejected);

		const whitelistChannel = interaction.channel.guild.channels.cache.find((channel: any) => channel.name.toLowerCase() == Constants.whitelistChannelName);
		const approvalRequest = await whitelistChannel.messages.fetch(messageUuid);

		if (approvalRequest !== undefined) {
			const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
			embedToUpdate.color = Colors.Red;
			await approvalRequest.edit({ content: requestDenied, embeds: [embedToUpdate], components: [] });
		}

		Utils.client.users.fetch(discordUuid, false).then(async (user: any) => {
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

export async function confirmUsernameChange(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		const minecraftUuid = interaction.customId.split('-')[2];

		await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);

		const approvalRequest = interaction.message;
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.color = Colors.Green;

		await interaction.message.edit({ content: '✅ La mise à jour de username a été complétée.', embeds: [embedToUpdate], components: [] });

		Utils.client.users.fetch(discordUuid, false).then(async (user: any) => {
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

export async function deleteUser(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.deleteEntryWithDiscordUuid(discordUuid);

		const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
		embedToUpdate.color = Colors.Red;
		await interaction.message.edit({ content: '🗑️ L\'utilisateur a été supprimé de la base de données', embeds:[embedToUpdate], components: [] });
		await interaction.reply({ content: 'L\'utilisateur a été supprimé de la base de données.', ephemeral: true })
	}
	catch (e) { 
		await interaction.reply(e.message);
	}
}