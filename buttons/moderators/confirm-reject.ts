import { editApprovalRequest } from '../../services/admin-approval';
import { changeStatus } from '../../services/database';
import { inscriptionStatus } from '../../bot-constants';
import { ButtonInteraction, Colors, GuildMember, Message, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { ButtonEvents } from '../../strings';
import { fetchBotChannel, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('confirm-reject', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	const messageUuid = interaction.customId.split('_')[2];

	let member: GuildMember;
	let statusChanged = false;

	const whitelistChannel = await fetchBotChannel(interaction.guild);
	let approvalRequest: Message | null = await whitelistChannel.messages.fetch(messageUuid).catch(() => null);

	await interaction.message.delete();

	try {
		await changeStatus(discordUuid, inscriptionStatus.approved);
		statusChanged = true;
		member = await fetchGuildMember(interaction.guild, discordUuid);
	}
	catch (e) {
		if (statusChanged)
			await interaction.reply(e.message + '\n' + template(ButtonEvents.rejection.userStillInBdExplanation, {discordUuid: discordUuid}));
		else
			await interaction.reply({ content: e.message, ephemeral: true });

		if (approvalRequest) await approvalRequest.delete();
		return;
	}

	if (approvalRequest)
		await editApprovalRequest(approvalRequest, template(ButtonEvents.rejection.requestDenied, {discordUuid: interaction.user.id}), undefined, [], Colors.Red);

	await sendMessageToMember(
		ButtonEvents.rejection.messageSentToUserToInformRejection,
		member,
		interaction,
		template(ButtonEvents.rejection.success, {discordUuid: discordUuid}),
		template(ButtonEvents.rejection.successNoDm, {discordUuid: discordUuid})
	);
}