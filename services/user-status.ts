import * as DatabaseService from '../services/database';
import * as Constants from '../bot-constants';
import * as Strings from '../strings';
import * as Utils from '../utils';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import * as RconService from '../services/rcon';

export async function editUserStatus(interaction: ChatInputCommandInteraction, status: number) {
	const idToEdit = interaction.options.getUser('membre').id;
	let member: GuildMember;

	try {
		member = await interaction.guild.members.fetch(idToEdit);
	}
	catch {
		await interaction.reply(Strings.errors.noDiscordUserWithThisUuid);
		return;
	}

	await DatabaseService.changeStatus(idToEdit, status).catch(async (e) => {
		await interaction.reply(e.message);
		return;
	});

	try {
		const user = await DatabaseService.getUserByDiscordUuid(idToEdit);
		if (status === Constants.inscriptionStatus.approved)
			await RconService.whitelistAdd(user.minecraft_uuid);
		else
			await RconService.whitelistRemove(user.minecraft_uuid);
	}
	catch {
		await interaction.reply((status === Constants.inscriptionStatus.approved)
				? Strings.errors.rcon.add
				: Strings.errors.rcon.remove);

		return;
	}

	let role = await Utils.fetchPlayerRole(interaction.guild);
	(status === Constants.inscriptionStatus.approved)
			? await member.roles.add(role.id)
			: await member.roles.remove(role.id);

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