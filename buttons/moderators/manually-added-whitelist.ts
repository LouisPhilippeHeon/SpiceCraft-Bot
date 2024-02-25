import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { changeStatus } from '../../services/database';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { addPlayerRole, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('manually-added-whitelist', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
		await changeStatus(discordUuid, inscriptionStatus.approved);
	}
	catch (e) {
		await interaction.reply({content: e.message, ephemeral: true});
		await interaction.message.delete();
		return;
	}

	await addPlayerRole(member);
	await editApprovalRequest(interaction.message, template(strings.ButtonEvents.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	await sendMessageToMember(
		strings.ButtonEvents.approbation.messageSentToPlayerToConfirmInscription,
		member,
		interaction,
		template(strings.ButtonEvents.approbation.success, {discordUuid: discordUuid}),
		template(strings.ButtonEvents.approbation.successNoDm, {discordUuid: discordUuid})
	);
}