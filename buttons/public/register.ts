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

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	dmChannel = await interaction.user.createDM();

	info(template(Logs. memberClickedRegisterButton, {username: interaction.user.username}));

	const user = await getUserByDiscordUuid(interaction.user.id).catch(() => null);

	try {
		if (user && user.inscription_status === inscriptionStatus.rejected)
			await interaction.reply({ content: ButtonEvents.enrolling.adminsAlreadyDeniedRequest, ephemeral: true });
		else if (user)
			await updateExistingUser(user);
		else
			await registerUser();
	}
	catch (e) {
		if (e.code === 50007) await interaction.reply({ content: ButtonEvents.enrolling.dmsAreClosed, ephemeral: true });
		else throw e;
	}
}

async function registerUser() {
	let minecraftUsernameSentByUser;
	let userFromMojangApi;

	try {
		const isFirstTimeMember = await askIfFirstTimeMember();
		minecraftUsernameSentByUser = await askWhatIsMinecraftUsername();
		userFromMojangApi = await getMojangUser(minecraftUsernameSentByUser);

		let userThatInvited;

		if (isFirstTimeMember) {
			userThatInvited = await askWhoInvited();
			await getRulesAcknowledgment();
		}

		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(ButtonEvents.enrolling.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: minecraftUsernameSentByUser}));
		else if (e.message === Errors.database.notUnique) {
			await dmChannel.send(Errors.usernameUsedWithAnotherAccount);
			warn(template(Logs.usernameAlreadyTaken, {discordUsername: interaction.user.username, minecraftUsername: userFromMojangApi.name}));
		}
		else if (e.message)
			await dmChannel.send(e.message);
	}
}

async function askIfFirstTimeMember(): Promise<boolean> {
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

	const askIfFirstTimeMemberMessage = await interaction.user.send({ content: ButtonEvents.enrolling.askIfFirstTimePlaying, components: [row] });

	await interaction.reply({ content: ButtonEvents.enrolling.messageSentInDms, ephemeral: true });
	let buttonClicked: ButtonInteraction;

	try {
		const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		buttonClicked = await askIfFirstTimeMemberMessage.awaitMessageComponent({ filter: collectorFilter, time: timeoutUserInput }) as ButtonInteraction;
	}
	catch (e) {
		throw new Error(Errors.userResponseTimeout);
	}

	let components = askIfFirstTimeMemberMessage.components[0].components;
	const newRow = new ActionRowBuilder<ButtonBuilder>();
	components.forEach((component: ButtonComponent) => {
		const wasClicked = component.customId === buttonClicked.customId;

		const newComponent = new ButtonBuilder({
			customId: component.customId,
			label: component.label,
			style: (wasClicked) ? ButtonStyle.Primary : component.style,
			disabled: true
		});

		newRow.addComponents(newComponent);
	});

	await askIfFirstTimeMemberMessage.edit({ components: [newRow] });

	// TODO disable buttons
	if (buttonClicked.customId === 'first-time-member') {
		await buttonClicked.reply(ButtonEvents.enrolling.welcome);
		return true;
	}
	else {
		await buttonClicked.reply(ButtonEvents.enrolling.welcomeBack);
		return false;
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

async function askWhoInvited(): Promise<string> {
	await dmChannel.send(ButtonEvents.enrolling.askWhoInvitedNewPlayer);

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

	const rulesMessage = await dmChannel.send({ content: ButtonEvents.enrolling.reactToAcceptRules, embeds: [rulesEmbed] });
	await rulesMessage.react('✅');

	// Collect emoji reactions
	const collectorFilter = (reaction: MessageReaction, user: User) => (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (emojisCollected.size === 0)
		throw new Error(Errors.userResponseTimeout);
}

async function updateExistingUser(userFromDb: UserFromDb) {
	await interaction.user.send(ButtonEvents.enrolling.askWhatIsNewMinecraftUsername);
	await interaction.reply({ content: ButtonEvents.enrolling.messageSentInDms, ephemeral: true });

	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeoutUserInput });
	if (usernameCollected.size === 0) {
		await dmChannel.send(Errors.userResponseTimeout);
		return;
	}

	const usernameSentByUser: string = usernameCollected.first().content;
	let userFromMojangApi;

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(ButtonEvents.enrolling.sameMinecraftAccountAsBefore);
			return;
		}

		// User awaiting approval, edit approval request instead of creating another request
		if (userFromDb.inscription_status === inscriptionStatus.awaitingApproval) {
			await changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
			await updateAdminApprovalRequest(userFromMojangApi.name);
			await dmChannel.send(ButtonEvents.enrolling.requestSucessfullyUpdated);
		}
		else {
			await createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
			await dmChannel.send(ButtonEvents.enrolling.usernameUpdated);
		}
	}
	catch (e) {
		if (e.message === Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser}));
		else if (e.message === Errors.database.notUnique) {
			await dmChannel.send(Errors.usernameUsedWithAnotherAccount);
			warn(template(Logs.usernameAlreadyTaken, {discordUsername: interaction.user.username, minecraftUsername: userFromMojangApi.name}));
		}
		else await dmChannel.send(e.message);
	}
}

async function updateAdminApprovalRequest(minecraftUsername: string) {
	const description = template(ButtonEvents.enrolling.embedDescription, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	const messageToSendInCaseOfFailure = template(ButtonEvents.enrolling.awaitingApprovalUserChangedMinecraftUsername, {discordUuid: interaction.user.id, minecraftUsername: minecraftUsername});
	await editApprovalRequestOfUser(interaction.user, interaction.guild, description, messageToSendInCaseOfFailure);
}