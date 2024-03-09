import { createApprovalRequest, createUsernameChangeRequest, editApprovalRequestOfUser } from '../../services/admin-approval';
import { inscriptionStatus, timeoutUserInput } from '../../bot-constants';
import { changeMinecraftUuid, createUser, getUserByDiscordUuid, getUserByMinecraftUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { info } from '../../services/logger';
import { ButtonData, UserFromDb, UserFromMojangApi } from '../../models';
import { ButtonEvents, Components, Errors, Logs } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('inscription');

let userFromMojangApi: UserFromMojangApi = null;
let interaction: ButtonInteraction = null;
let dmChannel: DMChannel = null;
let userThatInvited: string = null;
let isFirstTimeMember: boolean = null;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;

	info(template(Logs. memberClickedRegisterButton, {username: interaction.user.username}));

	try {
		const user = await getUserByDiscordUuid(interaction.user.id)
		if (user.inscription_status === inscriptionStatus.rejected)
			await interaction.reply({ content: ButtonEvents.enrolling.adminsAlreadyDeniedRequest, ephemeral: true });
		else
			await updateExistingUser(user);
	}
	catch (e) {
		await registerUser();
	}
}

async function registerUser() {
	let minecraftUsernameSentByUser;

	try {
		await askIfFirstTimeMember();
		minecraftUsernameSentByUser = await askWhatIsMinecraftUsername()
		userFromMojangApi = await getMojangUser(minecraftUsernameSentByUser);

		if (isFirstTimeMember) {
			await askWhoInvited();
			await getRulesAcknowledgment();
		}

		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(ButtonEvents.enrolling.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: minecraftUsernameSentByUser}));
		else if (e.message === Errors.database.notUnique)
			await dmChannel.send(Errors.usernameUsedWithAnotherAccount);
		else if (e.message)
			await dmChannel.send(e.message);
	}
}

async function askIfFirstTimeMember() {
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

	let askIfFirstTimeMemberMessage;

	try {
		askIfFirstTimeMemberMessage = await interaction.user.send({ content: ButtonEvents.enrolling.askIfFirstTimePlaying, components: [row] });
		dmChannel = askIfFirstTimeMemberMessage.channel as DMChannel;
	}
	catch (e) {
		await interaction.reply({ content: ButtonEvents.enrolling.dmsAreClosed, ephemeral: true });
		throw new Error();
	}

	await interaction.reply({ content: ButtonEvents.enrolling.messageSentInDms, ephemeral: true });
	let buttonClicked;

	try {
		const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		buttonClicked = await askIfFirstTimeMemberMessage.awaitMessageComponent({ filter: collectorFilter, time: timeoutUserInput });
	}
	catch (e) {
		throw new Error(Errors.userResponseTimeout);
	}

	// TODO disable buttons
	if (buttonClicked.customId === 'first-time-member') {
		await buttonClicked.reply(ButtonEvents.enrolling.welcome);
		isFirstTimeMember = true;
	}
	else if (buttonClicked.customId === 'not-first-time-member') {
		await buttonClicked.reply(ButtonEvents.enrolling.welcomeBack);
		isFirstTimeMember = false;
	}
}

async function askWhatIsMinecraftUsername(): Promise<string> {
	await dmChannel.send(ButtonEvents.enrolling.askWhatIsMinecraftUsername);
	// Collect message sent by user
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (usernameCollected.size === 0) {
		// TODO envoyer un bouton pour recommencer
		throw new Error(Errors.userResponseTimeout);
	}
	return usernameCollected.first().content;
}

async function askWhoInvited() {
	await dmChannel.send(ButtonEvents.enrolling.askWhoInvitedNewPlayer);

	// Collect answer
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
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
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (emojisCollected.size === 0)
		throw new Error(Errors.userResponseTimeout);
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
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
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
			await dmChannel.send(ButtonEvents.enrolling.requestSucessfullyUpdated);
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
	const description = template(ButtonEvents.enrolling.embedDescription, {discordUuid: interaction.user.id, minecraftUsername: userFromMojangApi.name});
	const messageToSendInCaseOfFailure = template(ButtonEvents.enrolling.awaitingApprovalUserChangedMinecraftUsername, {discordUuid: interaction.user.id, minecraftUsername: userFromMojangApi.name});
	await editApprovalRequestOfUser(interaction.user, interaction.guild, description, messageToSendInCaseOfFailure);
}