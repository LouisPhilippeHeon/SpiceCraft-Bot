import * as DatabaseService from '../services/database';
import * as Constants from '../bot-constants';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;
	let member: GuildMember;

	try {
		member = await Utils.fetchGuildMember(interaction.guild, idToEdit);
		await DatabaseService.changeStatus(idToEdit, status);

		(status === Constants.inscriptionStatus.approved)
				? await Utils.addPlayerRole(member)
				: await Utils.removePlayerRole(member);

		const user = await DatabaseService.getUserByDiscordUuid(idToEdit);
		if (status === Constants.inscriptionStatus.approved)
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

	if (status === Constants.inscriptionStatus.awaitingApproval) {
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
	if (status == Constants.inscriptionStatus.approved) return Strings.services.userStatus.dmAddedToWhitelist;
	if (status == Constants.inscriptionStatus.rejected) return Strings.services.userStatus.dmRemovedFromWhitelist;
}