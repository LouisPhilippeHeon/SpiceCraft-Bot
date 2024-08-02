import { editApprovalRequest } from '../../services/admin-approval';
import { ButtonData } from '../../models/button-data';
import { changeStatus } from '../../services/database';
import { inscriptionStatus } from '../../bot-constants';
import { ButtonInteraction, Colors, GuildMember, Message, PermissionFlagsBits } from 'discord.js';
import { ErrorType, SpiceCraftError } from '../../models/error';
import { getUserFriendlyErrorMessage } from '../../services/error-handler';
import { ButtonEvents } from '../../strings';
import { fetchBotChannel, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('confirm-reject', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const [_, discordUuid, messageUuid] = interaction.customId.split('_');

	let member: GuildMember;

	const whitelistChannel = await fetchBotChannel(interaction.guild);
	const approvalRequest: Message | null = await whitelistChannel.messages.fetch(messageUuid).catch(() => null);

	await interaction.message.delete();

	await changeStatus(discordUuid, inscriptionStatus.approved);

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
	}
	catch (e) {
		if (approvalRequest) await approvalRequest.delete();
		throw new SpiceCraftError(getUserFriendlyErrorMessage(e) + '\n' + template(ButtonEvents.rejection.userStillInBdExplanation, {discordUuid: discordUuid}), ErrorType.discordApi, e.stack);
	}

	if (approvalRequest)
		await editApprovalRequest(approvalRequest, template(ButtonEvents.rejection.requestDenied, {discordUuid: interaction.user.id}), undefined, [], Colors.Red);

	const messageOnSuccess = template(ButtonEvents.rejection.success, {discordUuid: discordUuid});
	const messageOnFailure = template(ButtonEvents.rejection.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.rejection.messageSentToUserToInformRejection, member, interaction, messageOnSuccess, messageOnFailure);
}