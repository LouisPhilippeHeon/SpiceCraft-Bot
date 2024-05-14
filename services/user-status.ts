import { inscriptionStatus } from '../bot-constants';
import { getUserByDiscordUuid } from './database';
import { ChatInputCommandInteraction } from 'discord.js';
import { Services, getStatusName } from '../strings';
import { addPlayerRole, fetchGuildMember, removePlayerRole, template } from '../utils';

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;
	const silent = interaction.options.getBoolean('silencieux');
	const userFromDb = await getUserByDiscordUuid(idToEdit);
	const member = await fetchGuildMember(interaction.guild, userFromDb.discord_uuid);

	await userFromDb.changeStatus(status);

	if (status === inscriptionStatus.approved) {
		await addPlayerRole(member);
		await userFromDb.addToWhitelist();
	}
	else {
		await removePlayerRole(member);
		await userFromDb.removeFromWhitelist();
	}

	let interactionReplyMessage = template(Services.userStatus.statusChanged, {
		discordUuid: userFromDb.discord_uuid,
		status: getStatusName(status)
	});

	if (!silent && status !== inscriptionStatus.awaitingApproval) {
		try {
			await member.send(getMessageToSendToUser(status));
		}
		catch {
			interactionReplyMessage += '\n' + Services.userStatus.cantSendDm;
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