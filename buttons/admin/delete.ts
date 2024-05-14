import { editApprovalRequest } from '../../services/admin-approval';
import { ButtonData } from '../../models/button-data';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { Commands } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('delete', PermissionFlagsBits.Administrator);

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();

	const discordUuid = interaction.customId.split('_')[1];
	const userFromDb = await getUserByDiscordUuid(discordUuid);
	await userFromDb.delete();
	await userFromDb.removeFromWhitelist();

	await editApprovalRequest(interaction.message, Commands.deleteEntry.messageUpdate, undefined, [], Colors.Red);
	await interaction.reply({ content: template(Commands.deleteEntry.reply, {discordUuid: discordUuid}), ephemeral: true });
}