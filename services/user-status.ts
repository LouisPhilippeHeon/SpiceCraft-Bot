import * as Strings from '../strings';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { addPlayerRole, fetchGuildMember, removePlayerRole } from '../utils';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus, getUserByDiscordUuid } from './database';

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, idToEdit);
		await changeStatus(idToEdit, status);

		(status === inscriptionStatus.approved)
				? await addPlayerRole(member)
				: await removePlayerRole(member);

		const user = await getUserByDiscordUuid(idToEdit);
		if (status === inscriptionStatus.approved)
			await user.addToWhitelist();
		else
			await user.removeFromWhitelist();
	}
	catch (e) {
		await interaction.reply(e.message);
		return;
	}

	const interactionReplyMessage = Strings.services.userStatus.statusChanged
			.replace('$discordUuid$', idToEdit.toString())
			.replace('$status$', Strings.getStatusName(status));

	if (status === inscriptionStatus.awaitingApproval) {
		await interaction.reply(interactionReplyMessage);
		return;
	}

	if (interaction.options.getBoolean('silencieux')) return;

	try {
		await member.send(getMessageToSendToUser(status));
		await interaction.reply(interactionReplyMessage);
	}
	catch {
		await interaction.reply(interactionReplyMessage + '\n' + Strings.services.userStatus.cantSendDm);
	}
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved) return Strings.services.userStatus.dmAddedToWhitelist;
	if (status === inscriptionStatus.rejected) return Strings.services.userStatus.dmRemovedFromWhitelist;
}