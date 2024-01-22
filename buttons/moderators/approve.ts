import { editApprovalRequest } from '../../services/admin-approval';
import { inscriptionStatus } from '../../bot-constants';
import { getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import { ButtonData, UserFromDb } from '../../models';
import { ButtonEvents, Components } from '../../strings';
import { addPlayerRole, sendMessageToMember, template } from '../../utils';

export const data = new ButtonData('approve', PermissionFlagsBits.BanMembers);

let member: GuildMember;
let user: UserFromDb;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const discordUuid = interaction.customId.split('_')[1];

	try {
		user = await getUserByDiscordUuid(discordUuid);
		member = await user.fetchGuildMember(interaction.guild);
		await addToWhitelist(user, discordUuid);
		await user.changeStatus(inscriptionStatus.approved);
	}
	catch (e) {
		if (e.message !== 'rcon-failed') {
			await interaction.reply(e.message);
			await interaction.message.delete();
		}
		return;
	}

	await addPlayerRole(member);
	await editApprovalRequest(interaction.message, template(ButtonEvents.approbation.requestGranted, {discordUuid: interaction.user.id}), undefined, [], Colors.Green);

	await sendMessageToMember(
		ButtonEvents.approbation.messageSentToPlayerToConfirmInscription,
		member,
		interaction,
		template(ButtonEvents.approbation.success, {discordUuid: discordUuid}),
		template(ButtonEvents.approbation.successNoDm, {discordUuid: discordUuid})
	);
}

async function addToWhitelist(user: UserFromDb, discordUuid: string) {
	try {
		await user.addToWhitelist();
	}
	catch (e) {
		await rconFailed(discordUuid, e);
		throw new Error('rcon-failed');
	}
}

async function rconFailed(discordUuid: string, e: Error) {
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
	await editApprovalRequest(interaction.message, `${e.message} ${template(ButtonEvents.clickToConfirmChangesToWhitelist, {discordUuid: discordUuid})}`, undefined, [row], Colors.Yellow);

	await interaction.reply({content: ButtonEvents.approbation.changeWhitelistBeforeCliking, ephemeral: true});
}