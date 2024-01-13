import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Guild, User } from 'discord.js';
import * as Strings from '../strings';
import { fetchBotChannel } from '../utils';
import { UserFromMojangApi } from '../models';

export async function createApprovalRequest(user: User, guild: Guild, username: string, inviter: string) {
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
		description = Strings.components.descriptions.approvalRequestNewUser.replace('$discordUuid$', user.id).replace('$username$', username).replace('$inviter$', inviter.substring(0, 32));
	else
		description = Strings.components.descriptions.approvalRequest.replace('$discordUuid$', user.id).replace('$username$', username);

	const approvalRequestEmbed = new EmbedBuilder({
		title: Strings.components.titles.approvalRequest.replace('$discordUsername$', user.username),
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
		title: Strings.components.titles.usernameChangeRequest.replace('$discordUsername$', user.username),
		description: Strings.components.descriptions.usernameChangeRequest.replace('$discordUuid$', user.id).replace('$username$', userFromMojangApi.name),
		thumbnail: { url: user.displayAvatarURL({ size: 256 }) }
	});

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	await (await fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function findApprovalRequestOfMember(guild: Guild, memberUuid: string): Promise<Message> {
	const whitelistChannel = await fetchBotChannel(guild);
	return Array.from((await whitelistChannel.messages.fetch({ limit: 100 })).values()).find(message => message.embeds[0]?.description.includes(memberUuid));
}

// TODO Edit request