import * as Constants from '../bot-constants';
import * as HttpService from '../services/http';
import * as DatabaseService from '../services/database';
import * as RequestAdminApproval from './request-admin-approval';
import * as Texts from '../texts'
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
		interactionReference.reply(Texts.register.unknownError);
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
			usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}
		collectedMinecraftUsername = usernameCollected.first().content;
		HttpService.getUuidAndFormatedUsernameFromUsername(collectedMinecraftUsername).then(async (minecraftUuid: any) => {
			if (minecraftUuid.id === undefined) {
				dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', collectedMinecraftUsername));
				return;
			}
			collectedMinecraftUuid = minecraftUuid.id;
			collectedMinecraftUsername = minecraftUuid.name;

			// If user is already approved
			if (status === Constants.inscriptionStatus.approved) {
				RequestAdminApproval.sendUsernameChangeRequest(interactionReference, collectedMinecraftUsername, collectedMinecraftUuid);
				dmChannel.send(Texts.register.usernameUpdated);
			}
			else {
				updateAdminApprovalRequest(dmChannel);
			}

		}).catch((err) => {
			if (err.name == 'SequelizeUniqueConstraintError') {
				dmChannel.send(Texts.register.usernameUsedWithAnotherAccount);
				return;
			}
			dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
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
		const embedToUpdate = JSON.parse(JSON.stringify(approvalRequest.embeds[0]));
		//TODO Valider si marche
		embedToUpdate.description = Texts.register.embedDescription.replace('$discordUuid$', discordUuid).replace('$minecraftUsername$', collectedMinecraftUsername);
		approvalRequest.edit({ embeds: [embedToUpdate] });
	}

	await DatabaseService.changeMinecraftUuid(discordUuid, collectedMinecraftUuid);
	dmChannel.send(Texts.register.requestSucessfullyUpdated);
}

async function registerNewUser() {
	const usernameMessage = await interactionReference.member.send(Texts.register.askWhatIsMinecraftUsername);
	await interactionReference.reply({ content: Texts.register.messageSentInDms, ephemeral: true });
	const dmChannel = usernameMessage.channel;
	const collectorFilter = (m: any) => m.author.id == interactionReference.user.id;
	const usernameCollector = dmChannel.createMessageCollector({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

	usernameCollector.on('end', async (usernameCollected: any) => {
		if (usernameCollected.size === 0) {
			usernameMessage.reply(Texts.register.timeoutAnswer);
			return;
		}

		collectedMinecraftUsername = usernameCollected.first().content;
		HttpService.getUuidAndFormatedUsernameFromUsername(collectedMinecraftUsername).then((minecraftUuid: any) => {
			if (minecraftUuid.id === undefined) {
				dmChannel.send(Texts.register.minecraftAccountDoesNotExist.replace('$minecraftUsername$', collectedMinecraftUsername));
				return;
			}
			collectedMinecraftUuid = minecraftUuid.id;
			collectedMinecraftUsername = minecraftUuid.name;
			getRulesAcknowledgment(dmChannel);
		}).catch(() => {
			dmChannel.send(Texts.register.errorWhileConnectingToMojangServer);
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
		saveNewUserToDb(channel);
	}).catch(() => {
		rulesMessage.reply(Texts.register.timeoutAnswer);
		return;
	});
}

async function saveNewUserToDb(channel: any) {
	try {
		await DatabaseService.createUser(collectedMinecraftUuid, discordUuid);
		RequestAdminApproval.sendApprovalRequest(interactionReference, collectedMinecraftUsername);
		channel.send(Texts.register.waitForAdminApprobation);
	}
	catch (error) {
		channel.send(error.message);
	}
}