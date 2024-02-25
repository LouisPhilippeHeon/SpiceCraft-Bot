import { editApprovalRequest } from '../../services/admin-approval';
import { getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../../models';
import { strings } from '../../strings/strings';
import { sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('update', PermissionFlagsBits.BanMembers);

let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];
	let member: GuildMember;

	try {
		let user = await getUserByDiscordUuid(discordUuid);
		member = await user.fetchGuildMember(interaction.guild);
		await modifyWhitelist(user, minecraftUuid, discordUuid);
		await user.editMinecraftUuid(minecraftUuid);
	}
	catch (e) {
		if (e.message !== 'rcon-failed') {
			await interaction.reply(e.message);
			await interaction.message.delete();
		}
		return;
	}

	await editApprovalRequest(interaction.message, template(strings.ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	await sendMessageToMember(
		strings.ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange,
		member,
		interaction,
		template(strings.ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid}),
		template(strings.ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid})
	);
}

async function modifyWhitelist(user: UserFromDb, minecraftUuid: string, discordUuid: string) {
	try {
		await user.replaceWhitelistUsername(minecraftUuid);
	}
	catch (e) {
		await rconFailed(discordUuid, minecraftUuid, e);
		throw new Error('rcon-failed');
	}
}

async function rconFailed(discordUuid: string, minecraftUuid: string, e: Error) {
	const confirmManualModificationOfWhitelist = new ButtonBuilder({
		customId: `manually-modified-whitelist_${discordUuid}_${minecraftUuid}`,
		label: strings.Components.buttons.manuallyEditedWhitelist,
		style: ButtonStyle.Success
	});

	const cancel = new ButtonBuilder({
		customId: 'dissmiss',
		label: strings.Components.buttons.cancel,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmManualModificationOfWhitelist, cancel);
	await editApprovalRequest(interaction.message, `${e.message} ${template(strings.ButtonEvents.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

	await interaction.reply({ content: strings.ButtonEvents.usernameChangeConfirmation.changeWhitelistBeforeCliking, ephemeral: true });
}