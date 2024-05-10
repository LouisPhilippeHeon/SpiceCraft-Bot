import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Guild, User, APIEmbed } from 'discord.js';
import { Components } from '../strings';
import { UserFromMojangApi } from '../models/user-from-mojang-api';
import { deepCloneWithJson, fetchBotChannel, template } from '../utils';

export async function createApprovalRequest(user: User, guild: Guild, username: string, inviter?: string) {
	const approve = new ButtonBuilder({
		customId: `approve_${user.id}`,
		label: Components.buttons.approve,
		style: ButtonStyle.Success
	});

	const reject = new ButtonBuilder({
		customId: `reject_${user.id}`,
		label: Components.buttons.reject,
		style: ButtonStyle.Danger
	});

	let description: string;

	description = inviter
		? template(Components.descriptions.approvalRequestNewUser, {discordUuid: user.id, username: username, inviter: inviter.substring(0, 32)})
		: template(Components.descriptions.approvalRequest, {discordUuid: user.id, username: username});

	const approvalRequestEmbed = new EmbedBuilder({
		title: template(Components.titles.approvalRequest, {discordUsername: user.username}),
		description: description,
		thumbnail: { url: user.displayAvatarURL({size: 256}) }
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, reject);

	await (await fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function createUsernameChangeRequest(user: User, guild: Guild, userFromMojangApi: UserFromMojangApi) {
	const approve = new ButtonBuilder({
		customId: `update_${user.id}_${userFromMojangApi.id}`,
		label: Components.buttons.approve,
		style: ButtonStyle.Success
	});

	const ignore = new ButtonBuilder({
		customId: 'dismiss',
		label: Components.buttons.doNotUpdate,
		style: ButtonStyle.Secondary
	});

	const approvalRequestEmbed = new EmbedBuilder({
		title: template(Components.titles.usernameChangeRequest, {discordUsername: user.username}),
		description: template(Components.descriptions.usernameChangeRequest, {discordUuid: user.id, username: userFromMojangApi.name}),
		thumbnail: { url: user.displayAvatarURL({ size: 256 }) }
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	await (await fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function findApprovalRequestOfMember(guild: Guild, user: User): Promise<Message> {
	const whitelistChannel = await fetchBotChannel(guild);
	return Array.from((await whitelistChannel.messages.fetch({ limit: 100 })).values()).find(message => message.embeds[0]?.description.includes(user.id));
}

export async function editApprovalRequest(message: Message, content?: string | null, embedDescription?: string | null, components?: ActionRowBuilder<ButtonBuilder>[], color?: number) {
	const embedToUpdate = deepCloneWithJson(message.embeds[0]) as APIEmbed;

	if (color !== undefined) embedToUpdate.color = color;
	if (embedDescription !== undefined) embedToUpdate.description = embedDescription;

	await message.edit({
		...content !== undefined && {content},
		embeds: [embedToUpdate],
		...components && {components}
	});
}

export async function editApprovalRequestOfUser(user: User, guild: Guild, description: string, messageToSendInCaseOfFailure: string) {
	const whitelistChannel = await fetchBotChannel(guild);
	// Find approval request for the user in the whitelist channel
	const approvalRequest = await findApprovalRequestOfMember(guild, user);

	// If it can be fetched, update it, otherwise, send a message in the channel
	if (approvalRequest)
		await editApprovalRequest(approvalRequest, undefined, description);
	else
		await whitelistChannel.send(messageToSendInCaseOfFailure);
}