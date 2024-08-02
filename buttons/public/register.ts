import { createApprovalRequest, createUsernameChangeRequest, editApprovalRequestOfUser } from '../../services/admin-approval';
import { timeoutUserInput } from '../../bot-constants';
import { ButtonData } from '../../models/button-data';
import { changeMinecraftUuid, createUser, getUserByDiscordUuid } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message } from 'discord.js';
import { ErrorType, SpiceCraftError } from '../../models/error';
import { getUserFriendlyErrorMessage } from '../../services/error-handler';
import { getMojangUser } from '../../services/http';
import { info, warn } from '../../services/logger';
import { ButtonEvents, Components, Errors, Logs } from '../../strings';
import { UserFromDb } from '../../models/user-from-db';
import { UserFromMojangApi } from '../../models/user-from-mojang-api';
import { template } from '../../utils';

export const data = new ButtonData('inscription');

let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userFromDb: UserFromDb;
let userFromMojangApi: UserFromMojangApi;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	dmChannel = await interaction.user.createDM();
	userFromDb = await getUserByDiscordUuid(interaction.user.id).catch(() => null);

	info(template(Logs. memberClickedRegisterButton, {username: interaction.user.username}));

	try {
		if (!userFromDb)
			await registerUser();
		else if (userFromDb.isRejected())
			await interaction.reply({ content: ButtonEvents.register.adminsAlreadyDeniedRequest, ephemeral: true });
		else
			await updateExistingUser(userFromDb);
	}
	catch (e) {
		if (e.code === 50007)
			e.message = ButtonEvents.register.dmsAreClosed;
		throw e;
	}
}

async function registerUser(interactionToReplyFrom?: ButtonInteraction) {
	try {
		// TODO if askIfFirstTimeMember throws, the retry message will not reply to a message, creating another error
		const isFirstTimeMember = await askIfFirstTimeMember(interactionToReplyFrom);
		interactionToReplyFrom = await askWhatIsMinecraftUsername();

		let userThatInvited;

		if (isFirstTimeMember) {
			userThatInvited = await askWhoInvited(interactionToReplyFrom);
			interactionToReplyFrom = await getRulesAcknowledgment();
		}

		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);

		if (interactionToReplyFrom && !interactionToReplyFrom.replied)
			await interactionToReplyFrom.reply(ButtonEvents.register.waitForAdminApprobation);
		else
			await dmChannel.send(ButtonEvents.register.waitForAdminApprobation)
	}
	catch (e) {
		if (!(e instanceof SpiceCraftError)) throw e;
		await sendRetryMessage(convertToUserFriendlyMessages(e), true, (interactionToReplyFrom && !interactionToReplyFrom.replied) && interactionToReplyFrom);
	}
}

async function askIfFirstTimeMember(interactionToReplyFrom?: ButtonInteraction): Promise<boolean> {
	const notFirstTime = new ButtonBuilder({ customId: 'not-first-time-member', label: Components.buttons.yes, style: ButtonStyle.Secondary });
	const firstTime = new ButtonBuilder({ customId: 'first-time-member', label: Components.buttons.no, style: ButtonStyle.Secondary });
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(notFirstTime, firstTime);
	const message = { content: ButtonEvents.register.askIfFirstTimePlaying, components: [row] };

	const askIfFirstTimeMemberMessage = interactionToReplyFrom
		? await (await interactionToReplyFrom.reply(message)).fetch()
		: await interaction.user.send(message);

	if (!interaction.replied)
		await interaction.reply({ content: ButtonEvents.register.messageSentInDms, ephemeral: true });

	const selectedButton = await collectMessageComponent(askIfFirstTimeMemberMessage);
	const isFirstTimeMember = selectedButton.customId === 'first-time-member';

	await disableButtonsOfMessage(askIfFirstTimeMemberMessage, selectedButton);
	await selectedButton.reply(isFirstTimeMember ? ButtonEvents.register.welcome : ButtonEvents.register.welcomeBack);
	return isFirstTimeMember;
}

async function askWhatIsMinecraftUsername(interactionToReplyFrom?: ButtonInteraction): Promise<ButtonInteraction> {
	interactionToReplyFrom
		? await interactionToReplyFrom.reply(ButtonEvents.register.askWhatIsMinecraftUsername)
		: await dmChannel.send(ButtonEvents.register.askWhatIsMinecraftUsername);

	const minecraftUsernameSentByUser = await collectMessage();

	try {
		userFromMojangApi = await getMojangUser(minecraftUsernameSentByUser);
	}
	catch (e) {
		throw new SpiceCraftError(convertToUserFriendlyMessages(e, minecraftUsernameSentByUser), ErrorType.discordApi, e.stack);
	}

	const confirm = new ButtonBuilder({ customId: 'confirm-username-selection', label: Components.buttons.enthousiastYes, style: ButtonStyle.Primary });
	const reject = new ButtonBuilder({ customId: 'reject-username-selection', label: Components.buttons.noMadeAMistake, style: ButtonStyle.Secondary });
	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(confirm, reject);

	const confirmUsernameSelection = await dmChannel.send({ content: template(ButtonEvents.register.confirmSelectedUsername, {minecraftUsername: userFromMojangApi.name}), components: [row] });

	let selectedButton: ButtonInteraction;
	await collectMessageComponent(confirmUsernameSelection)
		.then((collected) => selectedButton = collected)
		.finally(async () => await disableButtonsOfMessage(confirmUsernameSelection));

	if (selectedButton.customId === 'reject-username-selection')
		return await askWhatIsMinecraftUsername(selectedButton);

	return selectedButton;
}

async function askWhoInvited(interactionToReplyFrom?: ButtonInteraction): Promise<string> {
	await interactionToReplyFrom.reply(ButtonEvents.register.askWhoInvitedNewPlayer);
	return await collectMessage();
}

async function getRulesAcknowledgment() {
	const rulesEmbed = new EmbedBuilder({ color: 0x0099FF, title: Components.titles.rules, description: Components.descriptions.rules });
	const acceptRules = new ButtonBuilder({ customId: 'accept-rules', label: 'J\'accepte !', style: ButtonStyle.Success });
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptRules);
	const rulesMessage = await dmChannel.send({ content: ButtonEvents.register.clickToAcceptRules, embeds: [rulesEmbed], components: [row] });

	return await collectMessageComponent(rulesMessage, 'accept-rules').finally(async () => await disableButtonsOfMessage(rulesMessage));
}

async function updateExistingUser(userFromDb: UserFromDb, interactionToReplyFrom?: ButtonInteraction) {
	const message = ButtonEvents.register.askWhatIsNewMinecraftUsername;
	interactionToReplyFrom
		? await interactionToReplyFrom.reply(message)
		: await dmChannel.send(message);

	if (!interaction.replied) await interaction.reply({ content: ButtonEvents.register.messageSentInDms, ephemeral: true });

	const usernameSentByUser = await collectMessage();

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (userFromDb.minecraft_uuid === userFromMojangApi.id) {
			await dmChannel.send(ButtonEvents.register.sameMinecraftAccountAsBefore);
			return;
		}

		// User awaiting approval, edit approval request instead of creating another request
		if (userFromDb.isAwaitingApproval()) {
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
		await sendRetryMessage(convertToUserFriendlyMessages(e, usernameSentByUser), false);
	}
}

async function sendRetryMessage(message: string, isNewUser: boolean, interactionToReplyFrom?: ButtonInteraction) {
	const retry = new ButtonBuilder({ customId: 'retry', label: Components.buttons.retry, style: ButtonStyle.Primary });
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(retry);
	const retryMessageToSend = { content: message, components: [row] };

	const retryMessage = interactionToReplyFrom
		? await (await interactionToReplyFrom.reply(retryMessageToSend)).fetch()
		: await dmChannel.send(retryMessageToSend);

	let selectedButton;
	try {
		selectedButton = await collectMessageComponent(retryMessage, 'retry');
	}
	catch {
		const linkToRegister = new ButtonBuilder({ url: interaction.message.url, label: Components.buttons.retry, style: ButtonStyle.Link });
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkToRegister);
		await retryMessage.edit({ components: [row] });
		return;
	}

	await disableButtonsOfMessage(retryMessage);
	isNewUser
		? await registerUser(selectedButton)
		: await updateExistingUser(userFromDb, selectedButton);
}

async function updateAdminApprovalRequest(minecraftUsername: string) {
	const description = template(ButtonEvents.register.embedDescription, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	const messageToSendInCaseOfFailure = template(ButtonEvents.register.awaitingApprovalUserChangedMinecraftUsername, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	await editApprovalRequestOfUser(interaction.user, interaction.guild, description, messageToSendInCaseOfFailure);
}

async function collectMessage(): Promise<string> {
	const collectorFilter = (m: Message) => m.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (collected.size === 0) throw new SpiceCraftError(Errors.userResponseTimeout, ErrorType.discordApi);
	return collected.first().content;
}

async function collectMessageComponent(message: Message, customId?: string): Promise<ButtonInteraction> {
	const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id && (i.customId === customId || !customId);
	return await message.awaitMessageComponent({ filter: collectorFilter, time: timeoutUserInput }).catch(() => {
		throw new SpiceCraftError(Errors.userResponseTimeout, ErrorType.discordApi);
	}) as ButtonInteraction;
}

async function disableButtonsOfMessage(message: Message, buttonToHighlight?: ButtonInteraction) {
	if (message.components.length === 0 || message.components[0].components.length === 0) {
		warn(template(Logs.noButtonsToDisable, {message: message.toJSON()}));
		return;
	}

	const components = message.components[0].components;
	const newRow = new ActionRowBuilder<ButtonBuilder>();
	components.forEach((component: ButtonComponent) => {
		const highlight = component.customId === buttonToHighlight?.customId;

		const newButton = new ButtonBuilder({
			customId: component.customId,
			label: component.label,
			style: highlight ? ButtonStyle.Primary : component.style,
			disabled: true
		});

		newRow.addComponents(newButton);
	});

	await message.edit({ components: [newRow] });
}

function convertToUserFriendlyMessages(e: Error, usernameSentByUser?: string): string {
	let message = getUserFriendlyErrorMessage(e);

	if (message === Errors.mojangApi.noMojangAccountWithThatUsername)
		message = template(ButtonEvents.register.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser});
	else if (message === Errors.database.notUnique)
		message = Errors.usernameUsedWithAnotherAccount;

	return message;
}