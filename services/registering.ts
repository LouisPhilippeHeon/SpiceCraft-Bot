import * as Constants from '../bot-constants';
import * as HttpService from './http';
import * as DatabaseService from './database';
import * as AdminApprovalService from './admin-approval';
import * as Strings from '../strings';
import * as Utils from '../utils';
import * as Models from '../models';
import { ButtonInteraction, Collection, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';

const rulesEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(Strings.embeds.titles.rules)
	.setDescription(Strings.embeds.descriptions.rules);

let userFromMojangApi: Models.UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;

export async function updateExistingUser(userFromDb: Models.UserFromDb, buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	await interaction.reply({ content: Strings.services.registering.messageSentInDms, ephemeral: true });
	const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsNewMinecraftUsername);
	dmChannel = usernameMessage.channel as DMChannel;
	const collectorFilter = (message: Message) => message.author.id == interaction.user.id;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: Collection<string, Message<boolean>>) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Strings.services.registering.timeoutAnswer);
			return;
		}

		let usernameSentByUser: string = usernameCollected.first().content;

		try {
			userFromMojangApi = await HttpService.getMojangUser(usernameSentByUser);
		}
		catch (e) {
			if (e.message === Strings.errors.api.noMojangAccountWithThatUsername) {
				await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
				return;
			}
			await dmChannel.send(e.message);
			return;
		}

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(Strings.services.registering.sameMinecraftAccountAsBefore);
			return;
		}
		try {
			// User awaiting approval, edit approval request instead of creating another request
			if (userFromDb.inscription_status !== Constants.inscriptionStatus.approved) {
				await updateAdminApprovalRequest();
				return;
			}
			// If user is already approved, change username
			try {
				await DatabaseService.getUserByMinecraftUuid(userFromMojangApi.id);
				await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
			}
			catch {
				await AdminApprovalService.createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
				await dmChannel.send(Strings.services.registering.usernameUpdated);
			}
		}
		catch (e) {
			if (e.name == 'SequelizeUniqueConstraintError') {
				await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
				return;
			}
			await dmChannel.send(Strings.errors.generic);
		}
	});
}

export async function registerNewUser(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsMinecraftUsername);
	await interaction.reply({ content: Strings.services.registering.messageSentInDms, ephemeral: true });
	dmChannel = usernameMessage.channel as DMChannel;
	const collectorFilter = (message: Message) => message.author.id == interaction.user.id;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: Collection<string, Message<boolean>>) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Strings.services.registering.timeoutAnswer);
			return;
		}

		let usernameSentByUser: string = usernameCollected.first().content;

		try {
			userFromMojangApi = await HttpService.getMojangUser(usernameSentByUser);
		}
		catch (e) {
			if (e.message === Strings.errors.api.noMojangAccountWithThatUsername) {
				await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
				return;
			}
			await dmChannel.send(e.message);
			return;
		}
		await getRulesAcknowledgment();
	});
}

async function getRulesAcknowledgment() {
	const rulesMessage = await dmChannel.send({ content: Strings.services.registering.reactToAcceptRules, embeds: [rulesEmbed] });
	rulesMessage.react('✅');

	const emojiFilter = (reaction: MessageReaction, user: User) => {
		return (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	};

	rulesMessage.awaitReactions({ filter: emojiFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout, errors: ['time'] }).then(async () => {
		await saveNewUserToDb();
	}).catch(async () => {
		await rulesMessage.reply(Strings.services.registering.timeoutAnswer);
	});
}

async function updateAdminApprovalRequest() {
	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	// Find approval request for the user in the whitelist channel
	const approvalRequest = await AdminApprovalService.findApprovalRequestOfMember(interaction.guild, interaction.user.id)
	// If message is too old to be updated
	if (approvalRequest === undefined) {
		await whitelistChannel.send(Strings.services.registering.awaitingApprovalUserChangedMinecraftUsername.replace('$discordUuid$', interaction.user.id).replace('$minecraftUsername$', userFromMojangApi.name));
	}
	else {
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.description = Strings.services.registering.embedDescription.replace('$discordUuid$', interaction.user.id).replace('$minecraftUsername$', userFromMojangApi.name);
		await approvalRequest.edit({ embeds: [embedToUpdate] });
	}

	await DatabaseService.changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
	await dmChannel.send(Strings.services.registering.requestSucessfullyUpdated);
}

async function saveNewUserToDb() {
	try {
		await DatabaseService.createUser(userFromMojangApi.id, interaction.user.id);
		await AdminApprovalService.createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name);
		await dmChannel.send(Strings.services.registering.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === Strings.errors.database.notUnique) {
			await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
			return;
		}
		await dmChannel.send(e.message);
	}
}