import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { ButtonData } from '../../models/button-data';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { ButtonEvents } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('ban', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	let userFromDb;
	const discordUuid = interaction.customId.split('_')[1];

	try {
		userFromDb = await getUserByDiscordUuid(discordUuid);
	}
	catch (e) {
		await interaction.message.delete();
		throw e;
	}

	await userFromDb.removeFromWhitelist();
	await userFromDb.changeStatus(inscriptionStatus.rejected);
	await editApprovalRequest(interaction.message, template(ButtonEvents.ban.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);
	await interaction.reply({ content: template(ButtonEvents.ban.reply, {discordUuid: discordUuid}), ephemeral: true });
}