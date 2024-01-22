import { createUsernameChangeRequest, editApprovalRequest, findApprovalRequestOfMember } from '../../services/admin-approval';
import { inscriptionStatus, timeToWaitForUserInputBeforeTimeout } from '../../bot-constants';
import { changeMinecraftUuid, getUserByDiscordUuid, getUserByMinecraftUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, Message } from 'discord.js';
import { ephemeralInteractions } from '../../ephemeral-interactions';
import { getMojangUser } from '../../services/http';
import { ButtonData, UserFromDb, UserFromMojangApi } from '../../models';
import { ButtonEvents, Components, Errors } from '../../strings';
import { fetchBotChannel, template } from '../../utils';

export const data = new ButtonData('inscription');

let dmChannel: DMChannel;
let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	await getUserByDiscordUuid(interaction.user.id).then(async (user) => {
		if (user.inscription_status === inscriptionStatus.rejected)
			await interaction.reply({ content: ButtonEvents.enrolling.adminsAlreadyDeniedRequest, ephemeral: true });
		else
			await updateExistingUser(user);
	}).catch(async () => await askIfFistTimeUser());
}

async function askIfFistTimeUser() {
	// Avoid having mutiple of these messages, because it means user could start register process multiple times
	if (ephemeralInteractions.get(interaction.user.id)) {
		await (ephemeralInteractions.get(interaction.user.id).deleteReply());
		ephemeralInteractions.delete(interaction.user.id);
	}

	const firstTime = new ButtonBuilder({
		customId: 'register_true',
		label: Components.buttons.yes,
		style: ButtonStyle.Secondary
	});

	const notFirstTime = new ButtonBuilder({
		customId: 'register_false',
		label: Components.buttons.no,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstTime, notFirstTime);
	await interaction.reply({ content: ButtonEvents.enrolling.askIfFirstTimePlaying,	components: [row], ephemeral: true });

	ephemeralInteractions.set(interaction.user.id, interaction);
}

async function updateExistingUser(userFromDb: UserFromDb) {
	try {
		const usernameMessage = await interaction.user.send(ButtonEvents.enrolling.askWhatIsNewMinecraftUsername);
		dmChannel = usernameMessage.channel as DMChannel;
	}
	catch (e) {
		await interaction.reply({ content: ButtonEvents.enrolling.dmsAreClosed, ephemeral: true });
		return;
	}

	await interaction.reply({content: ButtonEvents.enrolling.messageSentInDms, ephemeral: true});

	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (usernameCollected.size === 0) {
		await dmChannel.send(Errors.userResponseTimeout);
		return;
	}

	const usernameSentByUser: string = usernameCollected.first().content;

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(ButtonEvents.enrolling.sameMinecraftAccountAsBefore);
			return;
		}

		// User awaiting approval, edit approval request instead of creating another request
		if (userFromDb.inscription_status === inscriptionStatus.awaitingApproval) {
			await changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
			await updateAdminApprovalRequest();
			return;
		}

		// Looks for another user with the same Minecraft UUID
		if (await getUserByMinecraftUuid(userFromMojangApi.id))
			await dmChannel.send(Errors.usernameUsedWithAnotherAccount);
		else {
			await createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
			await dmChannel.send(ButtonEvents.enrolling.usernameUpdated);
		}
	}
	catch (e) {
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser}));
		else
			await dmChannel.send(e.message);
	}
}

async function updateAdminApprovalRequest() {
	const whitelistChannel = await fetchBotChannel(interaction.guild);
	// Find approval request for the user in the whitelist channel
	const approvalRequest = await findApprovalRequestOfMember(interaction.guild, interaction.user.id);
	// If message is too old to be updated
	if (approvalRequest) {
		const description = template(ButtonEvents.enrolling.embedDescription, {
			discordUuid: interaction.user.id,
			minecraftUsername: userFromMojangApi.name
		});

		await editApprovalRequest(approvalRequest, undefined, description, undefined, undefined);
	}
	else {
		const message = template(ButtonEvents.enrolling.awaitingApprovalUserChangedMinecraftUsername, {
			discordUuid: interaction.user.id,
			minecraftUsername: userFromMojangApi.name
		});

		await whitelistChannel.send(message);
	}

	await dmChannel.send(ButtonEvents.enrolling.requestSucessfullyUpdated);
}