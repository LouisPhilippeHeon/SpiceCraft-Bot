import * as Strings from '../strings';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Guild, User, APIEmbed } from 'discord.js';
import { deepCloneWithJson, fetchBotChannel, template } from '../utils';
import { UserFromMojangApi } from '../models';

export async function createApprovalRequest(user: User, guild: Guild, username: string, inviter?: string) {
	const approve = new ButtonBuilder({
		customId: `approve_${user.id}`,
		label: Strings.components.buttons.approve,
		style: ButtonStyle.Success
	});

	const reject = new ButtonBuilder({
		customId: `reject_${user.id}`,
		label: Strings.components.buttons.reject,
		style: ButtonStyle.Danger
	});

	let description: string;

	if (inviter)
		description = template(Strings.components.descriptions.approvalRequestNewUser, {discordUuid: user.id, username: username, inviter: inviter.substring(0, 32)});
	else
		description = template(Strings.components.descriptions.approvalRequest, {discordUuid: user.id, username: username});

	const approvalRequestEmbed = new EmbedBuilder({
		title: template(Strings.components.titles.approvalRequest, {discordUsername: user.username}),
		description: description,
		thumbnail: { url: user.displayAvatarURL({ size: 256 }) }
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, reject);

	await (await fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function createUsernameChangeRequest(user: User, guild: Guild, userFromMojangApi: UserFromMojangApi) {
	const approve = new ButtonBuilder({
		customId: `update_${user.id}_${userFromMojangApi.id}`,
		label: Strings.components.buttons.approve,
		style: ButtonStyle.Success
	});

	const ignore = new ButtonBuilder({
		customId: 'dissmiss',
		label: Strings.components.buttons.doNotUpdate,
		style: ButtonStyle.Secondary
	});

	const approvalRequestEmbed = new EmbedBuilder({
		title: template(Strings.components.titles.usernameChangeRequest, {discordUsername: user.username}),
		description: template(Strings.components.descriptions.usernameChangeRequest, {discordUuid: user.id, username: userFromMojangApi.name}),
		thumbnail: { url: user.displayAvatarURL({ size: 256 }) }
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	await (await fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function findApprovalRequestOfMember(guild: Guild, memberUuid: string): Promise<Message> {
	const whitelistChannel = await fetchBotChannel(guild);
	return Array.from((await whitelistChannel.messages.fetch({ limit: 100 })).values()).find(message => message.embeds[0]?.description.includes(memberUuid));
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