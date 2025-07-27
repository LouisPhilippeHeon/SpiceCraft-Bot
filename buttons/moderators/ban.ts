import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { ButtonEvents } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('ban', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	try {
		const userFromDb = await getUserByDiscordUuid(discordUuid);
		await userFromDb.removeFromWhitelist();
		await userFromDb.changeStatus(inscriptionStatus.rejected);
	} catch (e) {
		await interaction.reply({ content: e.message, flags: MessageFlags.Ephemeral });
		await interaction.message.delete();
		return;
	}

	await editApprovalRequest(interaction.message, template(ButtonEvents.ban.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);
	await interaction.reply({ content: template(ButtonEvents.ban.reply, {discordUuid: discordUuid}), flags: MessageFlags.Ephemeral });
}