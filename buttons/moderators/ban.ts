import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { getUserByDiscordUuid } from '../../services/database';
import { ButtonInteraction, Colors, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { template } from '../../utils';

export const data = new ButtonData('ban', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	try {
		let user = await getUserByDiscordUuid(discordUuid);
		await user.removeFromWhitelist();
		await user.changeStatus(inscriptionStatus.rejected);
	}
	catch (e) {
		await interaction.reply({content: e.message, ephemeral: true});
		await interaction.message.delete();
		return;
	}

	await editApprovalRequest(interaction.message, template(strings.ButtonEvents.ban.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);
	await interaction.reply({content: template(strings.ButtonEvents.ban.reply, {discordUuid: discordUuid}), ephemeral: true});
}