import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { ButtonData } from '../../models/button-data';
import { changeStatus } from '../../services/database';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonEvents } from '../../strings';
import { addPlayerRole, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('manually-added-whitelist', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
	}
	catch (e) {
		await interaction.message.delete();
		throw e;
	}

	await changeStatus(discordUuid, inscriptionStatus.approved);

	await addPlayerRole(member);
	await editApprovalRequest(interaction.message, template(ButtonEvents.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	const messageOnSuccess = template(ButtonEvents.approbation.success, {discordUuid: discordUuid});
	const messageOnFailure = template(ButtonEvents.approbation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.approbation.messageSentToPlayerToConfirmInscription, member, interaction, messageOnSuccess, messageOnFailure);
}