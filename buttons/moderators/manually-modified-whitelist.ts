import { editApprovalRequest } from '../../services/admin-approval';
import { ButtonData } from '../../models/button-data';
import { changeMinecraftUuid } from '../../services/database';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonEvents } from '../../strings';
import { fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
	}
	catch (e) {
		await interaction.message.delete();
		throw e;
	}

	await changeMinecraftUuid(discordUuid, minecraftUuid);

	await editApprovalRequest(interaction.message, template(ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: discordUuid}), undefined, [], Colors.Green);

	const replyOnSuccess = template(ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid});
	const replyOnFailure = template(ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange, member, interaction, replyOnSuccess, replyOnFailure);
}