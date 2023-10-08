import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as DatabaseService from '../../services/database';
import * as Constants from '../../bot-constants';
import * as Texts from '../../texts'
import * as Models from '../../models'

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
					{ name: 'En attente', value: Constants.inscriptionStatus.awaitingApproval.toString() }
				))
		.addStringOption(option =>
			option.setName('format')
				.setDescription('Afficher les données avec quel format?')
				.addChoices(
					{ name: 'JSON', value: 'json' },
					{ name: 'Message', value: 'message' }
				)),
	async execute(interaction: ChatInputCommandInteraction) {
		const status: number = interaction.options.getString('statut') ? Number(interaction.options.getString('statut')) : null;
		const format = interaction.options.getString('format');
		
		const usersFromDb = await DatabaseService.getUsers(status);

		if (usersFromDb.length == 0) {
			await interaction.reply(Texts.displayUsers.noUserFound);
			return;
		}

		if (format == 'json') {
			await sendAsJson(interaction, usersFromDb, status);
			return;
		}

		await sendMessages(interaction, createMessages(usersFromDb), status);
	}
};

async function sendAsJson(interaction: ChatInputCommandInteraction, usersFromDb: Models.UserFromDb[], status: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(JSON.stringify(usersFromDb)),
			name: (status) ? Texts.displayUsers.fileNameWithStatus.replace('$status$', Texts.getStatusName(status)) : Texts.displayUsers.filename
		}]
	});
};

function createMessages(usersFromDb: Models.UserFromDb[]): string[] {
	const messages = [];
	let currentMessage = '';

	// Cuts data in multiple messages in order to bypass the 2000 caracter limit of Discord messages
	usersFromDb.forEach((user: Models.UserFromDb) => {
		if (currentMessage.length > 1844) {
			messages.push(currentMessage);
			currentMessage = '';
		}
		currentMessage += Texts.displayUsers.databaseEntryLine
			.replace('$discordUuid$', user.discord_uuid)
			.replace('$minecraftUuid$', user.minecraft_uuid)
			.replace('$statusEmoji$', Texts.statusToEmoji(user.inscription_status));
	});
	messages.push(currentMessage);

	return messages;
};

async function sendMessages(interaction: ChatInputCommandInteraction, messages: string[], status: number) {
	await interaction.reply({ content: (status)
		? Texts.displayUsers.displayingUsersWithStatus.replace('$status$', Texts.getStatusName(status))
		: Texts.displayUsers.displayingAllUsers });

	messages.forEach(async message => {
		await interaction.channel.send({ content: message });
	});
};