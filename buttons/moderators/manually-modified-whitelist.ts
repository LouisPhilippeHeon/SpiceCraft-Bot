import { editApprovalRequest } from '../../services/admin-approval';
import { ButtonData } from '../../models/button-data';
import { changeMinecraftUuid } from '../../services/database';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { handleError } from '../../services/error-handler';
import { ButtonEvents } from '../../strings';
import { fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const [_, discordUuid, minecraftUuid] = interaction.customId.split('_');
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
	}
	catch (e) {
		await handleError(e, data.name, interaction, undefined, true);
		return;
	}

	await changeMinecraftUuid(discordUuid, minecraftUuid);

	await editApprovalRequest(interaction.message, template(ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: discordUuid}), undefined, [], Colors.Green);

	const replyOnSuccess = template(ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid});
	const replyOnFailure = template(ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange, member, interaction, replyOnSuccess, replyOnFailure);
}