import * as Constants from '../bot-constants';
import * as HttpService from './http';
import * as DatabaseService from './database';
import * as AdminApprovalService from './admin-approval';
import * as Strings from '../strings';
import * as Utils from '../utils';
import * as Models from '../models';
import { ButtonInteraction, DMChannel, EmbedBuilder, Message, MessageReaction, User} from 'discord.js';

const rulesEmbed = new EmbedBuilder({
	color: 0x0099FF,
	title: Strings.components.titles.rules,
	description: Strings.components.descriptions.rules
});

let userFromMojangApi: Models.UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userThatInvited: string = null;

export async function updateExistingUser(userFromDb: Models.UserFromDb, buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;

	await interaction.reply({ content: Strings.services.registering.messageSentInDms, ephemeral: true });
	const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsNewMinecraftUsername);
	dmChannel = usernameMessage.channel as DMChannel;

	const collectorFilter = (message: Message) => message.author.id == interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
	if (usernameCollected.size === 0) {
		await usernameMessage.reply(Strings.services.registering.timeoutAnswer);
		return;
	}

	let usernameSentByUser: string = usernameCollected.first().content;

	try {
		userFromMojangApi = await HttpService.getMojangUser(usernameSentByUser);

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(Strings.services.registering.sameMinecraftAccountAsBefore);
			return;
		}

		// User awaiting approval, edit approval request instead of creating another request
		if (userFromDb.inscription_status !== Constants.inscriptionStatus.approved) {
			await updateAdminApprovalRequest();
			return;
		}

		// Looks for another user with the same Minecraft UUID
		if (await DatabaseService.getUserByMinecraftUuid(userFromMojangApi.id))
			await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
		else {
			await AdminApprovalService.createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
			await dmChannel.send(Strings.services.registering.usernameUpdated);
		}
	}
	catch (e) {
		if (e.message === Strings.errors.api.noMojangAccountWithThatUsername) {
			await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
			return;
		}
		if (e.name === 'SequelizeUniqueConstraintError') {
			await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
			return;
		}
		await dmChannel.send(e.message);
	}
}

export async function registerUser(buttonInteraction: ButtonInteraction, isFirstTimeUser: boolean) {
	interaction = buttonInteraction;

	const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsMinecraftUsername);
	dmChannel = usernameMessage.channel as DMChannel;

	// Collect message sent by user
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	if (usernameCollected.size === 0) {
		await dmChannel.send(Strings.services.registering.timeoutAnswer);
		return;
	}

	let usernameSentByUser: string = usernameCollected.first().content;

	try {
		userFromMojangApi = await HttpService.getMojangUser(usernameSentByUser);
		if (isFirstTimeUser) await registerFirstTimeUser();
		await getRulesAcknowledgment();
		await saveNewUserToDb();
	}
	catch (e) {
		if (e.message === Strings.errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
		else
			await dmChannel.send(e.message);
	}
}

async function registerFirstTimeUser() {
	await dmChannel.send(Strings.services.registering.askWhoInvitedNewPlayer);

	// Collect answer
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
	if (collected.size === 0) throw new Error (Strings.services.registering.timeoutAnswer);

	userThatInvited = collected.first().content;
}

async function getRulesAcknowledgment() {
	const rulesMessage = await dmChannel.send({ content: Strings.services.registering.reactToAcceptRules, embeds: [rulesEmbed] });
	rulesMessage.react('✅');

	// Collect emoji reactions
	const collectorFilter = (reaction: MessageReaction, user: User) =>  (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
	if (emojisCollected.size === 0) throw new Error(Strings.services.registering.timeoutAnswer);
}

async function updateAdminApprovalRequest() {
	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	// Find approval request for the user in the whitelist channel
	const approvalRequest = await AdminApprovalService.findApprovalRequestOfMember(interaction.guild, interaction.user.id);
	// If message is too old to be updated
	if (approvalRequest === undefined) {
		await whitelistChannel.send(
			Strings.services.registering.awaitingApprovalUserChangedMinecraftUsername
				.replace('$discordUuid$', interaction.user.id.toString)
				.replace('$minecraftUsername$', userFromMojangApi.name)
		);
	}
	else {
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);

		embedToUpdate.description = Strings.services.registering.embedDescription
			.replace('$discordUuid$', interaction.user.id)
			.replace('$minecraftUsername$', userFromMojangApi.name);

		await approvalRequest.edit({ embeds: [embedToUpdate] });
	}

	await dmChannel.send(Strings.services.registering.requestSucessfullyUpdated);
}

async function saveNewUserToDb() {
	try {
		await DatabaseService.createUser(userFromMojangApi.id, interaction.user.id);
		await AdminApprovalService.createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(Strings.services.registering.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === Strings.errors.database.notUnique)
			await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
		else
			await dmChannel.send(e.message);
	}
}