import { inscriptionStatus } from '../bot-constants';
import { changeStatus, getUserByDiscordUuid } from './database';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Services, getStatusName } from '../strings';
import { addPlayerRole, fetchGuildMember, removePlayerRole, template } from '../utils';

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;
	const silent = interaction.options.getBoolean('silencieux');

	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, idToEdit);
		await changeStatus(idToEdit, status);
		const userFromDb = await getUserByDiscordUuid(idToEdit);

		if (status === inscriptionStatus.approved) {
			await addPlayerRole(member);
			await userFromDb.addToWhitelist();
		}
		else {
			await removePlayerRole(member);
			await userFromDb.removeFromWhitelist();
		}
	} catch (e) {
		await interaction.reply(e.message);
		return;
	}

	const interactionReplyMessage = template(Services.userStatus.statusChanged, {
		discordUuid: idToEdit,
		status: getStatusName(status)
	});

	if (!silent && status !== inscriptionStatus.awaitingApproval) {
		try {
			await member.send(getMessageToSendToUser(status));
		} catch {
			await interaction.reply(interactionReplyMessage + '\n' + Services.userStatus.cantSendDm);
			return;
		}
	}

	await interaction.reply(interactionReplyMessage);
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved)
		return Services.userStatus.dmAddedToWhitelist;
	if (status === inscriptionStatus.rejected)
		return Services.userStatus.dmRemovedFromWhitelist;
}