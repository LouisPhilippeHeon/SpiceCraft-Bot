import { editApprovalRequest } from '../../services/admin-approval';
import { ButtonData } from '../../models/button-data';
import { getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ErrorType, SpiceCraftError } from '../../models/error';
import { handleError } from '../../services/error-handler';
import { ButtonEvents, Components } from '../../strings';
import { sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('update', PermissionFlagsBits.BanMembers);

let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const [_, discordUuid, minecraftUuid] = interaction.customId.split('_');
	let member: GuildMember;

	try {
		const userFromDb = await getUserByDiscordUuid(discordUuid);
		member = await userFromDb.fetchGuildMember(interaction.guild);

		await userFromDb.replaceWhitelistUsername(minecraftUuid);
		await userFromDb.editMinecraftUuid(minecraftUuid);
	}
	catch (e) {
		if (e instanceof SpiceCraftError && e.type == ErrorType.rcon)
			await rconFailed(discordUuid, minecraftUuid, e);
		else
			await handleError(e, data.name, interaction, null, true);

		return;
	}

	await editApprovalRequest(interaction.message, template(ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	const replyOnSuccess = template(ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid});
	const replyOnFailure = template(ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange, member, interaction, replyOnSuccess, replyOnFailure);
}

async function rconFailed(discordUuid: string, minecraftUuid: string, e: Error) {
	const confirmManualModificationOfWhitelist = new ButtonBuilder({
		customId: `manually-modified-whitelist_${discordUuid}_${minecraftUuid}`,
		label: Components.buttons.manuallyEditedWhitelist,
		style: ButtonStyle.Success
	});

	const cancel = new ButtonBuilder({
		customId: 'dismiss',
		label: Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(confirmManualModificationOfWhitelist, cancel);
	await editApprovalRequest(interaction.message, `${e.message} ${template(ButtonEvents.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

	await interaction.reply({ content: ButtonEvents.usernameChangeConfirmation.changeWhitelistBeforeCliking, ephemeral: true });
}