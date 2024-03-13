import { createApprovalRequest, createUsernameChangeRequest, editApprovalRequestOfUser } from '../../services/admin-approval';
import { inscriptionStatus, timeoutUserInput } from '../../bot-constants';
import { changeMinecraftUuid, createUser, getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { info, warn } from '../../services/logger';
import { ButtonData, UserFromDb } from '../../models';
import { ButtonEvents, Components, Errors, Logs } from '../../strings';
import { template } from '../../utils';

export const data = new ButtonData('inscription');

let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let user: UserFromDb;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	dmChannel = await interaction.user.createDM();
	user = await getUserByDiscordUuid(interaction.user.id).catch(() => null);

	info(template(Logs. memberClickedRegisterButton, {username: interaction.user.username}));

	try {
		if (user && user.inscription_status === inscriptionStatus.rejected)
			await interaction.reply({ content: ButtonEvents.register.adminsAlreadyDeniedRequest, ephemeral: true });
		else if (user)
			await updateExistingUser(user);
		else
			await registerUser();
	}
	catch (e) {
		if (e.code === 50007) await interaction.reply({ content: ButtonEvents.register.dmsAreClosed, ephemeral: true });
		else throw e;
	}
}

async function registerUser(interactionToReplyFrom?: ButtonInteraction) {
	let minecraftUsernameSentByUser;
	let userFromMojangApi;

	try {
		const isFirstTimeMember = await askIfFirstTimeMember(interactionToReplyFrom);
		minecraftUsernameSentByUser = await askWhatIsMinecraftUsername();
		userFromMojangApi = await getMojangUser(minecraftUsernameSentByUser);

		let userThatInvited;

		if (isFirstTimeMember) {
			userThatInvited = await askWhoInvited();
			await getRulesAcknowledgment();
		}

		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(ButtonEvents.register.waitForAdminApprobation);
	}
	catch (e) {
		let message = e.message;
		if (message === Errors.api.noMojangAccountWithThatUsername)
			message = template(ButtonEvents.register.minecraftAccountDoesNotExist, {minecraftUsername: minecraftUsernameSentByUser});
		else if (message === Errors.database.notUnique) {
			message = Errors.usernameUsedWithAnotherAccount;
			warn(template(Logs.usernameAlreadyTaken, {discordUsername: interaction.user.username, minecraftUsername: userFromMojangApi.name}));
		}

		await sendRetryMessage(message, true);
	}
}

async function askIfFirstTimeMember(interactionToReplyFrom?: ButtonInteraction): Promise<boolean> {
	const notFirstTime = new ButtonBuilder({
		customId: 'not-first-time-member',
		label: Components.buttons.yes,
		style: ButtonStyle.Secondary
	});

	const firstTime = new ButtonBuilder({
		customId: 'first-time-member',
		label: Components.buttons.no,
		style: ButtonStyle.Secondary
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(notFirstTime, firstTime);

	const message = { content: ButtonEvents.register.askIfFirstTimePlaying, components: [row] };
	const askIfFirstTimeMemberMessage = (interactionToReplyFrom) ? await (await interactionToReplyFrom.reply(message)).fetch() : await interaction.user.send(message);

	if (!interaction.replied) await interaction.reply({ content: ButtonEvents.register.messageSentInDms, ephemeral: true });
	let buttonClicked: ButtonInteraction;

	try {
		const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		buttonClicked = await askIfFirstTimeMemberMessage.awaitMessageComponent({ filter: collectorFilter, time: timeoutUserInput }) as ButtonInteraction;
	}
	catch (e) {
		firstTime.setDisabled();
		notFirstTime.setDisabled();
		row.setComponents([notFirstTime, firstTime]);
		await askIfFirstTimeMemberMessage.edit({ components: [row] });
		throw new Error(Errors.userResponseTimeout);
	}

	let components = askIfFirstTimeMemberMessage.components[0].components;
	const newRow = new ActionRowBuilder<ButtonBuilder>();
	components.forEach((component: ButtonComponent) => {
		const wasClicked = component.customId === buttonClicked.customId;

		const newButton = new ButtonBuilder({
			customId: component.customId,
			label: component.label,
			style: (wasClicked) ? ButtonStyle.Primary : component.style,
			disabled: true
		});

		newRow.addComponents(newButton);
	});

	await askIfFirstTimeMemberMessage.edit({ components: [newRow] });

	if (buttonClicked.customId === 'first-time-member') {
		await buttonClicked.reply(ButtonEvents.register.welcome);
		return true;
	}
	else {
		await buttonClicked.reply(ButtonEvents.register.welcomeBack);
		return false;
	}
}

async function askWhatIsMinecraftUsername(): Promise<string> {
	await dmChannel.send(ButtonEvents.register.askWhatIsMinecraftUsername);

	// Collect message sent by user
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (usernameCollected.size === 0) throw new Error(Errors.userResponseTimeout);

	return usernameCollected.first().content;
}

async function askWhoInvited(): Promise<string> {
	await dmChannel.send(ButtonEvents.register.askWhoInvitedNewPlayer);

	// Collect answer
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (collected.size === 0) throw new Error(Errors.userResponseTimeout);

	return collected.first().content;
}

async function getRulesAcknowledgment() {
	const rulesEmbed = new EmbedBuilder({
		color: 0x0099FF,
		title: Components.titles.rules,
		description: Components.descriptions.rules
	});

	const rulesMessage = await dmChannel.send({ content: ButtonEvents.register.reactToAcceptRules, embeds: [rulesEmbed] });
	await rulesMessage.react('✅');

	// Collect emoji reactions
	const collectorFilter = (reaction: MessageReaction, user: User) => (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (emojisCollected.size === 0) throw new Error(Errors.userResponseTimeout);
}

async function updateExistingUser(userFromDb: UserFromDb, interactionToReplyFrom?: ButtonInteraction) {
	const message = ButtonEvents.register.askWhatIsNewMinecraftUsername;
	(interactionToReplyFrom) ? await interactionToReplyFrom.reply(message) : await dmChannel.send(message);
	if (!interaction.replied) await interaction.reply({ content: ButtonEvents.register.messageSentInDms, ephemeral: true });

	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (usernameCollected.size === 0) throw new Error(Errors.userResponseTimeout);

	const usernameSentByUser = usernameCollected.first().content;
	let userFromMojangApi;

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(ButtonEvents.register.sameMinecraftAccountAsBefore);
			return;
		}

		// User awaiting approval, edit approval request instead of creating another request
		if (userFromDb.inscription_status === inscriptionStatus.awaitingApproval) {
			await changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
			await updateAdminApprovalRequest(userFromMojangApi.name);
			await dmChannel.send(ButtonEvents.register.requestSucessfullyUpdated);
		}
		else {
			await createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
			await dmChannel.send(ButtonEvents.register.usernameUpdated);
		}
	}
	catch (e) {
		let message;
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			message = template(ButtonEvents.register.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser});
		else if (e.message === Errors.database.notUnique) {
			message = Errors.usernameUsedWithAnotherAccount;
			warn(template(Logs.usernameAlreadyTaken, {discordUsername: interaction.user.username, minecraftUsername: userFromMojangApi.name}));
		}

		await sendRetryMessage(message, false);
	}
}

async function updateAdminApprovalRequest(minecraftUsername: string) {
	const description = template(ButtonEvents.register.embedDescription, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	const messageToSendInCaseOfFailure = template(ButtonEvents.register.awaitingApprovalUserChangedMinecraftUsername, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	await editApprovalRequestOfUser(interaction.user, interaction.guild, description, messageToSendInCaseOfFailure);
}

async function sendRetryMessage(message: string, newUser: boolean) {
	const retry = new ButtonBuilder({
		customId: 'retry',
		label: Components.buttons.retry,
		style: ButtonStyle.Primary
	});

	const row = new ActionRowBuilder<ButtonBuilder>();
	row.addComponents(retry);

	const retryMessage = await dmChannel.send({ content: message, components: [row] });
	const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id && i.customId === 'retry';

	let selectedButton;
	try {
		selectedButton = await retryMessage.awaitMessageComponent({ filter: collectorFilter, time: timeoutUserInput }) as ButtonInteraction;
	}
	catch {
		const linkToRegister = new ButtonBuilder({
			url: interaction.message.url,
			label: Components.buttons.retry,
			style: ButtonStyle.Link
		});
		const row = new ActionRowBuilder<ButtonBuilder>();
		row.addComponents(linkToRegister);

		await retryMessage.edit({components: [row]});
		return;
	}

	row.components[0].setDisabled(true);
	retryMessage.edit({ components: [row] });
	(newUser) ? await registerUser(selectedButton) : await updateExistingUser(user, selectedButton);
}