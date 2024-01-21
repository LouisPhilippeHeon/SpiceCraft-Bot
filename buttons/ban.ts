import { editApprovalRequest } from '../services/admin-approval';
import { inscriptionStatus } from '../bot-constants';
import { getUserByDiscordUuid } from '../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../models';
import { ButtonEvents } from '../strings';
import { template } from '../utils';

export const data = new ButtonData('ban', PermissionFlagsBits.BanMembers);

let user: UserFromDb;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const discordUuid = interaction.customId.split('_')[1];

	try {
		user = await getUserByDiscordUuid(discordUuid);
		await user.removeFromWhitelist();
		await user.changeStatus(inscriptionStatus.rejected);
	}
	catch (e) {
		await interaction.reply({content: e.message, ephemeral: true});
		await interaction.message.delete();
		return;
	}

	await editApprovalRequest(interaction.message, template(ButtonEvents.ban.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);
	await interaction.reply({content: template(ButtonEvents.ban.reply, {discordUuid: discordUuid}), ephemeral: true});
}