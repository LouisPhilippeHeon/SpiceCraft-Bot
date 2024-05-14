import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { ButtonData } from '../../models/button-data';
import { getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, PermissionFlagsBits } from 'discord.js';
import { getUserFriendlyErrorMessage } from '../../services/error-handler';
import { ButtonEvents, Components } from '../../strings';
import { addPlayerRole, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('approve', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];

	const userFromDb = await getUserByDiscordUuid(discordUuid);
	const member = await userFromDb.fetchGuildMember(interaction.guild);

	try {
		await userFromDb.addToWhitelist();
	}
	catch (e) {
		await rconFailed(userFromDb.discord_uuid, interaction, e);
		return;
	}

	await userFromDb.changeStatus(inscriptionStatus.approved);

	await addPlayerRole(member);
	await editApprovalRequest(interaction.message, template(ButtonEvents.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	const messageOnSuccess = template(ButtonEvents.approbation.success, {discordUuid: discordUuid});
	const messageOnFailure = template(ButtonEvents.approbation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.approbation.messageSentToPlayerToConfirmInscription, member, interaction, messageOnSuccess, messageOnFailure);
}

async function rconFailed(discordUuid: string, interaction: ButtonInteraction, e: Error) {
	const confirmManualAdditionToWhitelist = new ButtonBuilder({
		customId: `manually-added-whitelist_${discordUuid}`,
		label: Components.buttons.manuallyAddedToWhitelist,
		style: ButtonStyle.Success
	});

	const reject = new ButtonBuilder({
		customId: `reject_${discordUuid}`,
		label: Components.buttons.reject,
		style: ButtonStyle.Danger
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualAdditionToWhitelist, reject);
	await editApprovalRequest(interaction.message, `${getUserFriendlyErrorMessage(e, data.name)} ${template(ButtonEvents.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

	await interaction.reply({ content: ButtonEvents.approbation.changeWhitelistBeforeCliking, ephemeral: true });
}