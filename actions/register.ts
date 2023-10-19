import * as Constants from '../bot-constants';
import * as HttpService from '../services/http';
import * as DatabaseService from '../services/database';
import * as RequestAdminApproval from './request-admin-approval';
import * as Texts from '../texts'
import * as Utils from '../utils'
import * as Models from '../models'
import { ButtonInteraction, Collection, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';

const rulesEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(Texts.register.rulesEmbedTitle)
	.setDescription(Texts.register.rules);

let userFromMojangApi: Models.UserFromMojangApi;
let interactionReference: ButtonInteraction;
let discordUuid: string;

export async function handleInscriptionButtonClick(interaction: ButtonInteraction) {
	interactionReference = interaction;
	discordUuid = interactionReference.user.id;

	try {
		const userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

		if (userFromDb.inscription_status === Constants.inscriptionStatus.rejected) {
			await interactionReference.reply({ content: Texts.register.adminsAlreadyDeniedRequest, ephemeral: true });
			return;
		}

		await updateExistingUser(userFromDb).catch(async () => {
			await interactionReference.reply({ content: Texts.register.dmsAreClosed, ephemeral: true });
		});
	}
	// User does not exist in the database and should be created
	catch (e) {
		if (e.message === Constants.errorMessages.userDoesNotExist) {
			await registerNewUser().catch(async () => await interactionReference.reply({ content: Texts.register.dmsAreClosed, ephemeral: true }));
			return;
		}
		await interactionReference.reply(Texts.register.unknownError);
	}
};

async function updateExistingUser(userFromDb: Models.UserFromDb) {
	const usernameMessage = await interactionReference.user.send(Texts.register.askWhatIsNewMinecraftUsername);
	await interactionReference.reply({ content: Texts.register.messageSentInDms, ephemeral: true });
	const dmChannel = usernameMessage.channel as DMChannel;
	const collectorFilter = (message: Message) => message.author.id == discordUuid;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: Collection<string, Message<boolean>>) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}

		let usernameSentByUser: string = usernameCollected.first().content;
		let apiResponse;

		try {
			apiResponse = await HttpService.getUuidAndFormatedUsernameFromUsername(usernameSentByUser);
		}
		catch(e) {
			await dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
			return;
		}
		if ((apiResponse as Models.MojangApiError).errorMessage != null) {
			await dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
			return;
		}
		userFromMojangApi = apiResponse as Models.UserFromMojangApi;

		if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
			await dmChannel.send(Texts.register.sameMinecraftAccountAsBefore);
			return;
		}
		try {
			// If user is already approved
			if (userFromDb.inscription_status === Constants.inscriptionStatus.approved) {
				try {
					await DatabaseService.getUserByMinecraftUuid(userFromMojangApi.id);
					await dmChannel.send(Texts.register.usernameUsedWithAnotherAccount);
				}
				catch {
					await RequestAdminApproval.sendUsernameChangeRequest(interactionReference, userFromMojangApi);
					await dmChannel.send(Texts.register.usernameUpdated);
				}
			}
			else {
				await updateAdminApprovalRequest(dmChannel);
			}
		}
		catch(e) {
			if (e.name == 'SequelizeUniqueConstraintError') {
				await dmChannel.send(Texts.register.usernameUsedWithAnotherAccount);
				return;
			}
			await dmChannel.send(Texts.register.unknownError);
		}
	});
}

async function registerNewUser() {
	const usernameMessage = await interactionReference.user.send(Texts.register.askWhatIsMinecraftUsername);
	await interactionReference.reply({ content: Texts.register.messageSentInDms, ephemeral: true });
	const dmChannel: DMChannel = usernameMessage.channel as DMChannel;
	const collectorFilter = (message: Message) => message.author.id == interactionReference.user.id;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: Collection<string, Message<boolean>>) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}

		let usernameSentByUser: string = usernameCollected.first().content;
		let apiResponse;

		try {
			apiResponse = await HttpService.getUuidAndFormatedUsernameFromUsername(usernameSentByUser);
		}
		catch(e) {
			await dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
			return;
		}
		if ((apiResponse as Models.MojangApiError).errorMessage != null) {
			await dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
			return;
		}
		userFromMojangApi = apiResponse as Models.UserFromMojangApi;
		await getRulesAcknowledgment(dmChannel);
	});
}

async function getRulesAcknowledgment(channel: DMChannel) {
	const rulesMessage = await channel.send({ content: Texts.register.reactToAcceptRules, embeds: [rulesEmbed] });
	rulesMessage.react('✅');

	const emojiFilter = (reaction: MessageReaction, user: User) => {
		return (reaction.emoji.name == '✅') && (user.id === discordUuid);
	};

	rulesMessage.awaitReactions({ filter: emojiFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout, errors: ['time'] }).then(async () => {
		await saveNewUserToDb(channel);
	}).catch(async () => {
		await rulesMessage.reply(Texts.register.timeoutAnswer);
	});
}

async function updateAdminApprovalRequest(dmChannel: DMChannel) {
	const whitelistChannel = await Utils.fetchBotChannel(interactionReference.guild);
	const messagesOfWhitelistChannel = await whitelistChannel.messages.fetch({ limit: 100 });

	// Find approval request for the user in the whitelist channel
	const approvalRequest: Message = Array.from(messagesOfWhitelistChannel.values()).find(message => message.embeds[0]?.description.includes(`<@${discordUuid}>`));

	// If message is too old to be updated
	if (approvalRequest === undefined) {
		await whitelistChannel.send(Texts.register.unaprovedUserChangedMinecraftUsername.replace('$discordUuid$', discordUuid).replace('$minecraftUsername$', userFromMojangApi.name));
	}
	else {
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.description = Texts.register.embedDescription.replace('$discordUuid$', discordUuid).replace('$minecraftUsername$', userFromMojangApi.name);
		await approvalRequest.edit({ embeds: [embedToUpdate] });
	}

	await DatabaseService.changeMinecraftUuid(discordUuid, userFromMojangApi.id);
	await dmChannel.send(Texts.register.requestSucessfullyUpdated);
}

async function saveNewUserToDb(channel: DMChannel) {
	try {
		await DatabaseService.createUser(userFromMojangApi.id, discordUuid);
		await RequestAdminApproval.sendApprovalRequest(interactionReference, userFromMojangApi.name);
		await channel.send(Texts.register.waitForAdminApprobation);
	}
	catch (e) {
		await channel.send(e.message);
	}
}