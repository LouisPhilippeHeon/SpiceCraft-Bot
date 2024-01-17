import * as Strings from '../strings';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { addPlayerRole, fetchGuildMember, removePlayerRole } from '../utils';
import { inscriptionStatus } from '../bot-constants';
import { changeStatus, getUserByDiscordUuid } from './database';

const template = require('es6-template-strings');

let member: GuildMember;

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;

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

	const interactionReplyMessage = template(Strings.services.userStatus.statusChanged, {discordUuid: idToEdit, status: Strings.getStatusName(status)});

	if (!interaction.options.getBoolean('silencieux') || status === inscriptionStatus.awaitingApproval) {
		try {
			await member.send(getMessageToSendToUser(status));
		}
		catch {
			await interaction.reply(interactionReplyMessage + '\n' + Strings.services.userStatus.cantSendDm);
			return;
		}
	}

	await interaction.reply(interactionReplyMessage);
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved) return Strings.services.userStatus.dmAddedToWhitelist;
	if (status === inscriptionStatus.rejected) return Strings.services.userStatus.dmRemovedFromWhitelist;
}