import { createApprovalRequest, createUsernameChangeRequest, editApprovalRequest, findApprovalRequestOfMember } from '../../services/admin-approval';
import { inscriptionStatus, timeToWaitForUserInputBeforeTimeout } from '../../bot-constants';
import { changeMinecraftUuid, createUser, getUserByDiscordUuid, getUserByMinecraftUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { error, info } from '../../services/logger';
import { ButtonData, UserFromDb, UserFromMojangApi } from '../../models';
import { ButtonEvents, Components, Errors, Logs } from '../../strings';
import { fetchBotChannel, template } from '../../utils';

export const data = new ButtonData('inscription');

let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userThatInvited: string = null;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;

	info(template(Logs. memberClickedRegisterButton, {username: interaction.user.username}));

	getUserByDiscordUuid(interaction.user.id).then(async (user) => {
		if (user.inscription_status === inscriptionStatus.rejected)
			await interaction.reply({ content: ButtonEvents.enrolling.adminsAlreadyDeniedRequest, ephemeral: true });
		else
			await updateExistingUser(user);
	}).catch(async () => await registerUser());
}

async function registerUser() {
	const firstTime = new ButtonBuilder({
		customId: 'not-first-time-member',
		label: Components.buttons.yes,
		style: ButtonStyle.Secondary
	});
	const notFirstTime = new ButtonBuilder({
		customId: 'first-time-member',
		label: Components.buttons.no,
		style: ButtonStyle.Secondary
	});
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstTime, notFirstTime);

	let askIfFirstTimeMember;

	try {
		askIfFirstTimeMember = await interaction.user.send({ content: ButtonEvents.enrolling.askIfFirstTimePlaying, components: [row] });
		dmChannel = askIfFirstTimeMember.channel as DMChannel;
	}
	catch (e) {
		await interaction.reply({ content: ButtonEvents.enrolling.dmsAreClosed, ephemeral: true });
		return;
	}

	await interaction.reply({ content: ButtonEvents.enrolling.messageSentInDms, ephemeral: true });
	let isFirstTimeMemberReply;

	try {
		const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		isFirstTimeMemberReply = await askIfFirstTimeMember.awaitMessageComponent({ filter: collectorFilter, time: timeToWaitForUserInputBeforeTimeout });
	}
	catch (e) {
		await dmChannel.send(Errors.userResponseTimeout);
		return;
	}

	let isFirstTimeMember;
	// TODO disable buttons
	if (isFirstTimeMemberReply.customId === 'first-time-member') {
//		askIfFirstTimeMember.components = [];
		isFirstTimeMember = true;
	}
	else if (isFirstTimeMemberReply.customId === 'not-first-time-member') {
//		askIfFirstTimeMember.components = [];
		isFirstTimeMember = false;
	}
	else {
		error('TODO, add to strings.ts', 'REG_BTN');
		return;
	}

	await isFirstTimeMemberReply.reply(ButtonEvents.enrolling.askWhatIsMinecraftUsername);

	// Collect message sent by user
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (usernameCollected.size === 0) {
		// TODO envoyer un bouton pour recommencer
		await dmChannel.send(Errors.userResponseTimeout);
		return;
	}

	const usernameSentByUser = usernameCollected.first().content;

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (isFirstTimeMember) {
			await askWhoInvited();
			await getRulesAcknowledgment();
		}

		await saveNewUserToDb();
	}
	catch (e) {
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser}));
		else
			await dmChannel.send(e.message);
	}
}

async function askWhoInvited() {
	await dmChannel.send(ButtonEvents.enrolling.askWhoInvitedNewPlayer);

	// Collect answer
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (collected.size === 0) throw new Error(Errors.userResponseTimeout);

	userThatInvited = collected.first().content;
}

async function getRulesAcknowledgment() {
	const rulesEmbed = new EmbedBuilder({
		color: 0x0099FF,
		title: Components.titles.rules,
		description: Components.descriptions.rules
	});

	const rulesMessage = await dmChannel.send({ content: ButtonEvents.enrolling.reactToAcceptRules, embeds: [rulesEmbed] });
	await rulesMessage.react('✅');

	// Collect emoji reactions
	const collectorFilter = (reaction: MessageReaction, user: User) => (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (emojisCollected.size === 0)
		throw new Error(Errors.userResponseTimeout);
}

async function saveNewUserToDb() {
	try {
		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(ButtonEvents.enrolling.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === Errors.database.notUnique)
			await dmChannel.send(Errors.usernameUsedWithAnotherAccount);
		else
			await dmChannel.send(e.message);
	}
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
	const approvalRequest = await findApprovalRequestOfMember(interaction.guild, interaction.user);
	if (approvalRequest) {
		const description = template(ButtonEvents.enrolling.embedDescription, {discordUuid: interaction.user.id, minecraftUsername: userFromMojangApi.name});
		await editApprovalRequest(approvalRequest, undefined, description, undefined, undefined);
	}
	// In case it cannot be updated
	else {
		const message = template(ButtonEvents.enrolling.awaitingApprovalUserChangedMinecraftUsername, {discordUuid: interaction.user.id,minecraftUsername: userFromMojangApi.name});
		await whitelistChannel.send(message);
	}

	await dmChannel.send(ButtonEvents.enrolling.requestSucessfullyUpdated);
}