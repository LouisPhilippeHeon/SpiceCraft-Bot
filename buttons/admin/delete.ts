import { editApprovalRequest } from '../../services/admin-approval';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../../models';
import { Commands } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('delete', PermissionFlagsBits.Administrator);

let user: UserFromDb;

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();
	const discordUuid = interaction.customId.split('_')[1];

	try {
		user = await getUserByDiscordUuid(discordUuid);
		await user.removeFromWhitelist();
	}
	catch (e) {
		await interaction.reply({ content: e.message, ephemeral: true });
		return;
	}

	await editApprovalRequest( interaction.message, Commands.deleteEntry.messageUpdate, undefined, [], Colors.Red );
	await interaction.reply({ content: template(Commands.deleteEntry.reply, {discordUuid: discordUuid}), ephemeral: true });
}