import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import * as DatabaseService from '../../services/database';
import * as Constants from '../../bot-constants';
import * as Strings from '../../strings';
import * as Models from '../../models';
import * as HtmlService from '../../services/html';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('afficher')
		.setDescription(Strings.commands.displayUsers.description)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption(option =>
			option.setName('statut')
				.setDescription(Strings.commands.displayUsers.statusOptionDescription)
				.addChoices(
					{ name: 'Approuvé', value: Constants.inscriptionStatus.approved.toString() },
					{ name: 'Rejeté', value: Constants.inscriptionStatus.rejected.toString() },
					{ name: 'En attente', value: Constants.inscriptionStatus.awaitingApproval.toString() }
				))
		.addStringOption(option =>
			option.setName('format')
				.setDescription(Strings.commands.displayUsers.formatOptionDescription)
				.addChoices(
					{ name: 'HTML', value: 'html' },
					{ name: 'JSON', value: 'json' },
					{ name: 'Messages', value: 'messages' }
				)),
	async execute(interaction: ChatInputCommandInteraction) {
		const status: number = interaction.options.getString('statut') ? Number(interaction.options.getString('statut')) : null;
		const format = interaction.options.getString('format');

		const usersFromDb = await DatabaseService.getUsers(status);

		if (usersFromDb.length === 0) {
			await interaction.reply(Strings.commands.displayUsers.noUserFound);
			return;
		}

		switch (format) {
			case 'json':
				await sendAsJson(interaction, usersFromDb, status);
				break;
			case 'html':
				await sendAsHtml(interaction, usersFromDb);
				break;
			default:
				await sendMessages(interaction, createMessages(usersFromDb), status);
				break;
		}
	}
}

async function sendAsJson(interaction: ChatInputCommandInteraction, usersFromDb: Models.UserFromDb[], status: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(JSON.stringify(usersFromDb)),
			name: (status) ? Strings.commands.displayUsers.filenameJsonWithStatus.replace('$status$', Strings.getStatusName(status)) : Strings.commands.displayUsers.filenameJson
		}]
	});
}

async function sendAsHtml(interaction: ChatInputCommandInteraction, usersFromDb: Models.UserFromDb[]) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(HtmlService.buildHtml(usersFromDb)),
			name: Strings.commands.displayUsers.filenameHtml
		}]
	});
}

function createMessages(usersFromDb: Models.UserFromDb[]): string[] {
	const messages = [];
	let currentMessage = '';

	// Cuts data in multiple messages in order to bypass the 2000 caracter limit of Discord messages
	usersFromDb.forEach(user => {
		if (currentMessage.length > 1844) {
			messages.push(currentMessage);
			currentMessage = '';
		}
		currentMessage += Strings.commands.displayUsers.databaseEntryLine
			.replace('$discordUuid$', user.discord_uuid)
			.replace('$minecraftUuid$', user.minecraft_uuid)
			.replace('$statusEmoji$', Strings.statusToEmoji(user.inscription_status));
	});
	messages.push(currentMessage);

	return messages;
}

async function sendMessages(interaction: ChatInputCommandInteraction, messages: string[], status: number) {
	await interaction.reply({
		content: (status)
			? Strings.commands.displayUsers.displayingUsersWithStatus.replace('$status$', Strings.getStatusName(status))
			: Strings.commands.displayUsers.displayingAllUsers
	});

	messages.forEach(async message => {
		await interaction.channel.send({ content: message });
	});
}