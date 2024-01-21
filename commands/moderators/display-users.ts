import { inscriptionStatus } from '../../bot-constants';
import { getUsers } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { buildHtml } from '../../services/html';
import { UserFromDb } from '../../models';
import { Commands, getStatusName, statusToEmoji } from '../../strings';
import { template } from '../../utils';

export const data = new SlashCommandBuilder()
	.setName('afficher')
	.setDescription(Commands.displayUsers.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addStringOption(option =>
		option.setName('statut')
			  .setDescription(Commands.displayUsers.statusOptionDescription)
			  .addChoices(
				  { name: 'Approuvé', value: inscriptionStatus.approved.toString() },
				  { name: 'Rejeté', value: inscriptionStatus.rejected.toString() },
				  { name: 'En attente', value: inscriptionStatus.awaitingApproval.toString() }
			  ))
	.addStringOption(option =>
		option.setName('format')
			  .setDescription(Commands.displayUsers.formatOptionDescription)
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
		await interaction.reply(Commands.displayUsers.noUserFound);
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

async function sendAsJson(interaction: ChatInputCommandInteraction, usersFromDb: UserFromDb[], status?: number) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(JSON.stringify(usersFromDb)),
			name: (status !== undefined)
				? template(Commands.displayUsers.filenameJsonWithStatus, {status: getStatusName(status)})
				: Commands.displayUsers.filenameJson
		}]
	});
}

async function sendAsHtml(interaction: ChatInputCommandInteraction, usersFromDb: UserFromDb[]) {
	await interaction.reply({
		files: [{
			attachment: Buffer.from(buildHtml(usersFromDb)),
			name: Commands.displayUsers.filenameHtml
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
		currentMessage += template(Commands.displayUsers.databaseEntryLine, {
			discordUuid: user.discord_uuid,
			minecraftUuid: user.minecraft_uuid,
			statusEmoji: statusToEmoji(user.inscription_status)
		});
	});
	messages.push(currentMessage);

	return messages;
}

async function sendMessages(interaction: ChatInputCommandInteraction, messages: string[], status?: number) {
	await interaction.reply({
		content: (status === undefined)
			? Commands.displayUsers.displayingAllUsers
			: template(Commands.displayUsers.displayingUsersWithStatus, {status: getStatusName(status)})
	});

	messages.forEach(async message => {
		await interaction.channel.send({ content: message });
	});
}