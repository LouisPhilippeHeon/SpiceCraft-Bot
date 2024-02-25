import { editApprovalRequest } from '../../services/admin-approval';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { template } from '../../utils';

export const data = new ButtonData('delete', PermissionFlagsBits.Administrator);

export async function execute(interaction: ButtonInteraction) {
	await interaction.message.delete();
	const discordUuid = interaction.customId.split('_')[1];

	try {
		let user = await getUserByDiscordUuid(discordUuid);
		await user.removeFromWhitelist();
	}
	catch (e) {
		await interaction.reply({ content: e.message, ephemeral: true });
		return;
	}

	await editApprovalRequest( interaction.message, strings.Commands.deleteEntry.messageUpdate, undefined, [], Colors.Red );
	await interaction.reply({ content: template(strings.Commands.deleteEntry.reply, {discordUuid: discordUuid}), ephemeral: true });
}