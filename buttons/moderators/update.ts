import { editApprovalRequest } from '../../services/admin-approval';
import { getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../../models';
import { ButtonEvents, Components } from '../../strings';
import { sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('update', PermissionFlagsBits.BanMembers);

let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];
	let member: GuildMember;

	try {
		const userFromDb = await getUserByDiscordUuid(discordUuid);
		member = await userFromDb.fetchGuildMember(interaction.guild);
		await modifyWhitelist(userFromDb, minecraftUuid, discordUuid);
		await userFromDb.editMinecraftUuid(minecraftUuid);
	} catch (e) {
		if (e.message !== 'rcon-failed') {
			await interaction.reply(e.message);
			await interaction.message.delete();
		}
		return;
	}

	await editApprovalRequest(interaction.message, template(ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	const replyOnSuccess = template(ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid});
	const replyOnFailure = template(ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid});
	await sendMessageToMember(ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange, member, interaction, replyOnSuccess, replyOnFailure);
}

async function modifyWhitelist(user: UserFromDb, minecraftUuid: string, discordUuid: string) {
	try {
		await user.replaceWhitelistUsername(minecraftUuid);
	} catch (e) {
		await rconFailed(discordUuid, minecraftUuid, e);
		throw new Error('rcon-failed');
	}
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

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualModificationOfWhitelist, cancel);
	await editApprovalRequest(interaction.message, `${e.message} ${template(ButtonEvents.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

	await interaction.reply({ content: ButtonEvents.usernameChangeConfirmation.changeWhitelistBeforeCliking, flags: MessageFlags.Ephemeral });
}