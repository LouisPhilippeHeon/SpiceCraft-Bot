import { inscriptionStatus } from '../bot-constants';
import * as DatabaseService from '../services/database';
import * as Utils from '../utils'
import * as Constants from '../bot-constants';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from 'discord.js';

const requestGranted = '✅ La demande a été approuvée.';
const requestDenied = '❌ La demande a été rejetée.';
const addedText = 'Tu a été ajouté à la whitelist. Si tu n\'arrive pas à te connecter, ton username Minecraft est peut-être incorrect. Si c\'est le cas, clique à nouveau sur le bouton d\'inscription.';
const rejectedText = 'Désolé, mais les administrateurs ont choisi de ne pas t\'ajouter à la whitelist. Contacte-les pour plus de détails.';
const noDiscordUserWithThisUuidText = 'Le UUID Discord de l\'utilisateur qui s\'est inscrit ne correspond à aucun utilisateur existant.';

export async function approveUser(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		await DatabaseService.changeStatus(discordUuid, inscriptionStatus.approved);

		const approvalRequest = interaction.message;
		const embedToUpdate = JSON.parse(JSON.stringify(approvalRequest.embeds[0]));
		embedToUpdate.color = Colors.Green;

		interaction.message.edit({ content: requestGranted, embeds: [embedToUpdate], components: [] });

		interaction.guild.members.fetch(discordUuid, false).then(async (member: any) => {
			let role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
			if (!role) {
				interaction.guild.roles.create({
					name: Constants.playerRoleName,
					color: Colors.Green,
					reason: 'Le rôle pour les joueurs n\'existait pas, il a été créé.',
				});
				role = interaction.guild.roles.cache.find((r: any) => r.name == Constants.playerRoleName);
			}

			await member.roles.add(role.id);
			member.send(addedText);
			interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer de son ajout à la whitelist.`, ephemeral: true });
		}).catch(() => {
			interaction.reply(noDiscordUserWithThisUuidText);
		});
	}
	catch (e) {
		interaction.reply(e.message);
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
			.setCustomId('cancel-reject')
			.setLabel('Annuler')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder().addComponents(confirmRejection, cancel);
		await interaction.reply({ content: `Êtes vous certain de vouloir rejeter <@${discordUuid}> ?`, components: [row] });
	}
	catch (e) {
		interaction.reply(e.message);
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
			const embedToUpdate = JSON.parse(JSON.stringify(approvalRequest.embeds[0]));
			embedToUpdate.color = Colors.Red;
			approvalRequest.edit({ content: requestDenied, embeds: [embedToUpdate], components: [] });
		}

		Utils.client.users.fetch(discordUuid, false).then((user: any) => {
			user.send(rejectedText);
			interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer du refus.`, ephemeral: true });
		}).catch(() => {
			interaction.reply(noDiscordUserWithThisUuidText);
		});
	}
	catch (e) {
		interaction.reply(e.message);
	}
}

export async function confirmUsernameChange(interaction: any) {
	try {
		const discordUuid = interaction.customId.split('-')[1];
		const minecraftUuid = interaction.customId.split('-')[2];

		console.log(minecraftUuid, interaction.customId);
		await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);

		const approvalRequest = interaction.message;
		const embedToUpdate = JSON.parse(JSON.stringify(approvalRequest.embeds[0]));
		embedToUpdate.color = Colors.Green;

		interaction.message.edit({ content: '✅ La mise à jour de username a été complétée.', embeds: [embedToUpdate], components: [] });

		Utils.client.users.fetch(discordUuid, false).then((user: any) => {
			user.send('Ton username Minecraft a été mis à jour dans la whitelist.');
			interaction.reply({ content: `Un message a été envoyé à <@${discordUuid}> pour l'informer de la mise à jour du username.`, ephemeral: true });
		}).catch(() => {
			interaction.reply(noDiscordUserWithThisUuidText);
		});
	}
	catch (e) {
		interaction.reply(e.message);
	}
}