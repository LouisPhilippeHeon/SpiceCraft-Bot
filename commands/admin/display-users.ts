import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as DatabaseService from '../../services/database';
import * as Constants from '../../bot-constants';
import * as Utils from '../../utils'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('afficher')
		.setDescription('Affiche les utilisateurs inscrit selon leur statut (optionnel).')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('statut')
				.setDescription('Rechercher les utilisateur avec un statut particulier.')
				.addChoices(
					{ name: 'Approuvé', value: Constants.inscriptionStatus.approved.toString() },
					{ name: 'Rejeté', value: Constants.inscriptionStatus.rejected.toString() },
					{ name: 'En attente', value: Constants.inscriptionStatus.awaitingApproval.toString() },
				))
		.addStringOption(option =>
			option.setName('format')
				.setDescription('Afficher les données avec quel format?')
				.addChoices(
					{ name: 'JSON', value: 'json' },
					{ name: 'Message', value: 'message' },
				)),
	async execute(interaction: any) {
		const status = interaction.options.getString('statut');
		const users = await DatabaseService.getUsers(status);

		if (users.length == 0) {
			await interaction.reply('Aucun résultat ne correspond à ces critères');
			return;
		}

		if (interaction.options.getString('format') == 'json') {
			await sendAsJson(interaction, users, status);
			return;
		}

		await sendMessages(interaction, createMessages(users), status);
	},
};

async function sendAsJson(interaction: any, users: any, status: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(JSON.stringify(users)),
			name: (status) ? 'utilisateurs_' + Utils.statusToText(status) + '.json' : 'utilisateurs.json'
		}]
	})
};

function createMessages(users: any): string[] {
	const messages = [];
	let currentMessage = '';

	// Cuts data in multiple messages in order to bypass the 2000 caracter limit of Discord messages
	users.forEach((user: any) => {
		if (currentMessage.length > 1844) {
			messages.push(currentMessage);
			currentMessage = '';
		}
		currentMessage += `<@${user.discord_uuid}> | [Afficher](<https://api.mojang.com/user/profile/${user.minecraft_uuid}>) | ${Utils.statusToEmoji(user.inscription_status)}\n`;
	});
	messages.push(currentMessage);

	return messages;
};

async function sendMessages(interaction: any, messages: string[], status: number) {
	if (status) await interaction.reply({ content: 'Affichage des utilisateurs ' + Utils.statusToText(status)});
	else await interaction.reply({ content: 'Affichage de tous les utilisateurs'});

	messages.forEach(async message => {
		await interaction.channel.send({ content: message });
	});
};