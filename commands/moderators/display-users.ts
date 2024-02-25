import { inscriptionStatus } from '../../bot-constants';
import { getUsers } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildHtml } from '../../services/html';
import { UserFromDb } from '../../models';
import { strings } from '../../strings/strings';
import { template } from '../../utils';

export const data = new SlashCommandBuilder()
	.setName('afficher-membres')
	.setDescription(strings.Commands.displayUsers.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addStringOption(option =>
		option.setName('statut')
			  .setDescription(strings.Commands.displayUsers.statusOptionDescription)
			  .addChoices(
				  { name: 'Approuvé', value: inscriptionStatus.approved.toString() },
				  { name: 'Rejeté', value: inscriptionStatus.rejected.toString() },
				  { name: 'En attente', value: inscriptionStatus.awaitingApproval.toString() }
			  ))
	.addStringOption(option =>
		option.setName('format')
			  .setDescription(strings.Commands.displayUsers.formatOptionDescription)
			  .addChoices(
				  { name: 'HTML', value: 'html' },
				  { name: 'JSON', value: 'json' },
				  { name: 'Messages', value: 'messages' }
			  ));

export async function execute(interaction: ChatInputCommandInteraction) {
	const status: number | undefined = interaction.options.getString('statut') ? Number(interaction.options.getString('statut')) : undefined;
	const format = interaction.options.getString('format');

	const usersFromDb = await getUsers(status);

	if (usersFromDb.length === 0) {
		await interaction.reply(strings.Commands.displayUsers.noUserFound);
		return;
	}

	switch (format) {
		case 'json':
			await sendAsJson(interaction, usersFromDb, status);
			break;
		case 'html':
			await sendAsHtml(interaction, usersFromDb, status);
			break;
		default:
			await sendMessages(interaction, createMessages(usersFromDb), status);
			break;
	}
}

async function sendAsJson(interaction: ChatInputCommandInteraction, usersFromDb: UserFromDb[], status?: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(JSON.stringify(usersFromDb)),
			name: (status !== undefined)
				? template(strings.Commands.displayUsers.filenameJsonWithStatus, {status: strings.getStatusName(status)})
				: strings.Commands.displayUsers.filenameJson
		}]
	});
}

async function sendAsHtml(interaction: ChatInputCommandInteraction, usersFromDb: UserFromDb[], status?: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(buildHtml(usersFromDb, status)),
			name: (status !== undefined)
				? template(strings.Commands.displayUsers.filenameHtmlWithStatus, {status: strings.getStatusName(status)})
				: strings.Commands.displayUsers.filenameHtml
		}]
	});
}

function createMessages(usersFromDb: UserFromDb[]): string[] {
	const messages = [];
	let currentMessage = '';

	// Cuts data in multiple messages in order to bypass the 2000 caracter limit of Discord messages
	usersFromDb.forEach(user => {
		if (currentMessage.length > 1844) {
			messages.push(currentMessage);
			currentMessage = '';
		}

		const row = template(strings.Commands.displayUsers.databaseEntryLine, {
			discordUuid: user.discord_uuid,
			minecraftUuid: user.minecraft_uuid,
			statusEmoji: strings.statusToEmoji(user.inscription_status)
		});
		
		currentMessage = currentMessage.concat(row);
	});

	messages.push(currentMessage);
	return messages;
}

async function sendMessages(interaction: ChatInputCommandInteraction, messages: string[], status?: number) {
	await interaction.reply({
		content: (status === undefined)
			? strings.Commands.displayUsers.displayingAllUsers
			: template(strings.Commands.displayUsers.displayingUsersWithStatus, {status: strings.getStatusName(status)})
	});

	messages.forEach(async message => {
		await interaction.channel.send({ content: message });
	});
}