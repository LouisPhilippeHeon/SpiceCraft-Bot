import { createApprovalRequest } from '../../services/admin-approval';
import { timeToWaitForUserInputBeforeTimeout } from '../../bot-constants';
import { createUser } from '../../services/database';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { ephemeralInteractions } from '../../ephemeral-interactions';
import { getMojangUser } from '../../services/http';
import { ButtonData, UserFromMojangApi } from '../../models';
import { strings } from '../../strings/strings';
import { template } from '../../utils';

export const data = new ButtonData('register');

const rulesEmbed = new EmbedBuilder({
	color: 0x0099FF,
	title: strings.Components.titles.rules,
	description: strings.Components.descriptions.rules
});

let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userThatInvited: string = null;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;

	const argument = interaction.customId.split('_')[1];

	// Disable buttons and style the one that was clicked
	await disableButtons();

	ephemeralInteractions.delete(interaction.user.id);
	await registerUser(argument === 'false');
}

async function disableButtons() {
	const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

	if (interactionWithEphemeral) {
		let components = (await interactionWithEphemeral.fetchReply()).components[0].components;
		const row = new ActionRowBuilder<ButtonBuilder>();

		components.forEach((component: ButtonComponent) => {
			const wasClicked = component.customId === interaction.customId;

			const newComponent = new ButtonBuilder({
				customId: component.customId,
				label: component.label,
				style: (wasClicked) ? ButtonStyle.Primary : component.style,
				disabled: true
			});

			row.addComponents(newComponent);
		});
		await interactionWithEphemeral.editReply({ components: [row] });
	}
}

async function registerUser(isFirstTimeMember: boolean) {
	try {
		const usernameMessage = await interaction.user.send(strings.ButtonEvents.enrolling.askWhatIsMinecraftUsername);
		dmChannel = usernameMessage.channel as DMChannel;
	}
	catch (e) {
		await interaction.reply({ content: strings.ButtonEvents.enrolling.dmsAreClosed, ephemeral: true });
		return;
	}

	const replyMessage = isFirstTimeMember
		? strings.ButtonEvents.enrolling.messageSentInDmsNewUser
		: strings.ButtonEvents.enrolling.messageSentInDms;

	await interaction.reply({ content: replyMessage, ephemeral: true });

	// Collect message sent by user
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (usernameCollected.size === 0) {
		await dmChannel.send(strings.Errors.userResponseTimeout);
		return;
	}

	const usernameSentByUser: string = usernameCollected.first().content;

	try {
		userFromMojangApi = await getMojangUser(usernameSentByUser);

		if (isFirstTimeMember) {
			await askWhoInvited();
			await getRulesAcknowledgment();
		}

		await saveNewUserToDb();
	}
	catch (e) {
		if (e.message === strings.Errors.api.noMojangAccountWithThatUsername)
			await dmChannel.send(template(strings.ButtonEvents.enrolling.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser}));
		else
			await dmChannel.send(e.message);
	}
}

async function askWhoInvited() {
	await dmChannel.send(strings.ButtonEvents.enrolling.askWhoInvitedNewPlayer);

	// Collect answer
	const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
	const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (collected.size === 0) throw new Error(strings.Errors.userResponseTimeout);

	userThatInvited = collected.first().content;
}

async function getRulesAcknowledgment() {
	const rulesMessage = await dmChannel.send({ content: strings.ButtonEvents.enrolling.reactToAcceptRules, embeds: [rulesEmbed] });
	await rulesMessage.react('✅');

	// Collect emoji reactions
	const collectorFilter = (reaction: MessageReaction, user: User) => (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
	const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
	if (emojisCollected.size === 0)
		throw new Error(strings.Errors.userResponseTimeout);
}

async function saveNewUserToDb() {
	try {
		await createUser(interaction.user.id, userFromMojangApi.id);
		await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
		await dmChannel.send(strings.ButtonEvents.enrolling.waitForAdminApprobation);
	}
	catch (e) {
		if (e.message === strings.Errors.database.notUnique)
			await dmChannel.send(strings.Errors.usernameUsedWithAnotherAccount);
		else
			await dmChannel.send(e.message);
	}
}