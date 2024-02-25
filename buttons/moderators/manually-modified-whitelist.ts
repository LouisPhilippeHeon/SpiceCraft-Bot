import { editApprovalRequest } from '../../services/admin-approval';
import { changeMinecraftUuid } from '../../services/database';
import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

export async function execute(interaction: ButtonInteraction) {
	const discordUuid = interaction.customId.split('_')[1];
	const minecraftUuid = interaction.customId.split('_')[2];
	let member: GuildMember;

	try {
		member = await fetchGuildMember(interaction.guild, discordUuid);
		await changeMinecraftUuid(discordUuid, minecraftUuid);
	}
	catch (e) {
		await interaction.reply({ content: e.message, ephemeral: true });
		await interaction.message.delete();
		return;
	}

	await editApprovalRequest(interaction.message, template(strings.ButtonEvents.usernameChangeConfirmation.messageUpdate, {discordUuid: discordUuid}), undefined, [], Colors.Green);

	await sendMessageToMember(
		strings.ButtonEvents.usernameChangeConfirmation.messageSentToConfirmUsernameChange,
		member,
		interaction,
		template(strings.ButtonEvents.usernameChangeConfirmation.success, {discordUuid: discordUuid}),
		template(strings.ButtonEvents.usernameChangeConfirmation.successNoDm, {discordUuid: discordUuid})
	);
}