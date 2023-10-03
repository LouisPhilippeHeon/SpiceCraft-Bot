import * as Constants from '../bot-constants';
import * as HttpService from '../services/http';
import * as DatabaseService from '../services/database';
import * as RequestAdminApproval from './request-admin-approval';
import * as Texts from '../texts'
import * as Utils from '../utils'
import { EmbedBuilder } from 'discord.js';

const rulesEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(Texts.register.rulesEmbedTitle)
	.setDescription(Texts.register.rules);

let collectedMinecraftUsername: string;
let collectedMinecraftUuid: string;
let interactionReference: any;
let discordUuid: string;

export async function handleInscriptionButtonClick(interaction: any) {
	interactionReference = interaction;
	discordUuid = interactionReference.user.id;

	try {
		const userFromDb = await DatabaseService.getUserByDiscordUuid(discordUuid);

		if (userFromDb.inscription_status === Constants.inscriptionStatus.rejected) {
			await interactionReference.reply({ content: Texts.register.adminsAlreadyDeniedRequest, ephemeral: true });
			return;
		}

		await updateExistingUser(userFromDb.inscription_status).catch(async () => {
			await interactionReference.reply({ content: Texts.register.dmsAreClosed, ephemeral: true });
		});
	}
	// User does not exist in the database and should be created
	catch (error) {
		if (error.message === 'Cet utilisateur n\'existe pas!') {
			await registerNewUser().catch(async () => await interactionReference.reply({ content: Texts.register.dmsAreClosed, ephemeral: true }));
			return;
		}
		await interactionReference.reply(Texts.register.unknownError);
	}
};

async function updateExistingUser(status: number) {
	const usernameMessage = await interactionReference.member.send(Texts.register.askWhatIsNewMinecraftUsername);
	await interactionReference.reply({ content: Texts.register.messageSentInDms, ephemeral: true });
	const dmChannel = usernameMessage.channel;
	const collectorFilter = (m: any) => m.author.id == discordUuid;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: any) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}
		collectedMinecraftUsername = usernameCollected.first().content;
		HttpService.getUuidAndFormatedUsernameFromUsername(collectedMinecraftUsername).then(async (minecraftUuid: any) => {
			if (minecraftUuid.id === undefined) {
				await dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', collectedMinecraftUsername));
				return;
			}
			collectedMinecraftUuid = minecraftUuid.id;
			collectedMinecraftUsername = minecraftUuid.name;

			// If user is already approved
			if (status === Constants.inscriptionStatus.approved) {
				await RequestAdminApproval.sendUsernameChangeRequest(interactionReference, collectedMinecraftUsername, collectedMinecraftUuid);
				await dmChannel.send(Texts.register.usernameUpdated);
			}
			else {
				await updateAdminApprovalRequest(dmChannel);
			}

		}).catch(async (err) => {
			if (err.name == 'SequelizeUniqueConstraintError') {
				await dmChannel.send(Texts.register.usernameUsedWithAnotherAccount);
				return;
			}
			await dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
		});
	});
}

async function updateAdminApprovalRequest(dmChannel: any) {
	const whitelistChannel = interactionReference.channel.guild.channels.cache.find((channel: any) => channel.name.toLowerCase() == Constants.whitelistChannelName);
	const messagesOfWhitelistChannel = await whitelistChannel.messages.fetch({ limit: 100 });

	// Find approval request for the user in the whitelist channel
	const approvalRequest: any = Array.from(messagesOfWhitelistChannel.values()).find((val: any) => val.embeds[0]?.description.includes(`<@${discordUuid}>`));

	// If message is too old to be updated
	if (approvalRequest === undefined) {
		await whitelistChannel.send(Texts.register.unaprovedUserChangedMinecraftUsername.replace('$discordUuid$', discordUuid).replace('$minecraftUsername$', collectedMinecraftUsername));
	}
	else {
		const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);
		embedToUpdate.description = Texts.register.embedDescription.replace('$discordUuid$', discordUuid).replace('$minecraftUsername$', collectedMinecraftUsername);
		approvalRequest.edit({ embeds: [embedToUpdate] });
	}

	await DatabaseService.changeMinecraftUuid(discordUuid, collectedMinecraftUuid);
	await dmChannel.send(Texts.register.requestSucessfullyUpdated);
}

async function registerNewUser() {
	const usernameMessage = await interactionReference.member.send(Texts.register.askWhatIsMinecraftUsername);
	await interactionReference.reply({ content: Texts.register.messageSentInDms, ephemeral: true });
	const dmChannel = usernameMessage.channel;
	const collectorFilter = (m: any) => m.author.id == interactionReference.user.id;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: any) => {
		if (usernameCollected.size === 0) {
			await usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}

		collectedMinecraftUsername = usernameCollected.first().content;
		HttpService.getUuidAndFormatedUsernameFromUsername(collectedMinecraftUsername).then(async (minecraftUuid: any) => {
			if (minecraftUuid.id === undefined) {
				await dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', collectedMinecraftUsername));
				return;
			}
			collectedMinecraftUuid = minecraftUuid.id;
			collectedMinecraftUsername = minecraftUuid.name;
			await getRulesAcknowledgment(dmChannel);
		}).catch(async () => {
			await dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
		});
	});
}

async function getRulesAcknowledgment(channel: any) {
	const rulesMessage = await channel.send({ content: Texts.register.reactToAcceptRules, embeds: [rulesEmbed] });
	rulesMessage.react('✅');

	const emojiFilter = (reaction: any, user: any) => {
		return (reaction.emoji.name == '✅') && (user.id === discordUuid);
	};

	rulesMessage.awaitReactions({ filter: emojiFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout, errors: ['time'] }).then(async () => {
		await saveNewUserToDb(channel);
	}).catch(async () => {
		await rulesMessage.reply(Texts.register.timeoutAnswer);
		return;
	});
}

async function saveNewUserToDb(channel: any) {
	try {
		await DatabaseService.createUser(collectedMinecraftUuid, discordUuid);
		await RequestAdminApproval.sendApprovalRequest(interactionReference, collectedMinecraftUsername);
		await channel.send(Texts.register.waitForAdminApprobation);
	}
	catch (error) {
		await channel.send(error.message);
	}
}