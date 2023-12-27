import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Guild, User } from 'discord.js';
import * as Strings from '../strings';
import * as Models from '../models';
import * as Utils from '../utils';

export async function createApprovalRequest(user: User, guild: Guild, username: string, inviter: string) {
	const approve = new ButtonBuilder()
		.setCustomId(`approve_${user.id}`)
		.setLabel(Strings.components.buttons.approve)
		.setStyle(ButtonStyle.Success);

	const reject = new ButtonBuilder()
		.setCustomId(`reject_${user.id}`)
		.setLabel(Strings.components.buttons.reject)
		.setStyle(ButtonStyle.Danger);

	let description: string;

	if (inviter)
		description = Strings.components.descriptions.approvalRequestNewUser.replace('$discordUuid$', user.id).replace('$username$', username).replace('$inviter$', inviter.substring(0, 32));
	else
		description = Strings.components.descriptions.approvalRequest.replace('$discordUuid$', user.id).replace('$username$', username);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Strings.components.titles.approvalRequest.replace('$discordUsername$', user.username))
		.setDescription(description)
		.setThumbnail(user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, reject);

	await (await Utils.fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function createUsernameChangeRequest(user: User, guild: Guild, userFromMojangApi: Models.UserFromMojangApi) {
	const approve = new ButtonBuilder()
		.setCustomId(`update_${user.id}_${userFromMojangApi.id}`)
		.setLabel(Strings.components.buttons.approve)
		.setStyle(ButtonStyle.Success);

	const ignore = new ButtonBuilder()
		.setCustomId('dissmiss')
		.setLabel(Strings.components.buttons.doNotUpdate)
		.setStyle(ButtonStyle.Secondary);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Strings.components.titles.usernameChangeRequest.replace('$discordUsername$', user.username))
		.setDescription(Strings.components.descriptions.usernameChangeRequest.replace('$discordUuid$', user.id).replace('$username$', userFromMojangApi.name))
		.setThumbnail(user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	await (await Utils.fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function findApprovalRequestOfMember(guild: Guild, memberUuid: string): Promise<Message> {
	const whitelistChannel = await Utils.fetchBotChannel(guild);
	return Array.from((await whitelistChannel.messages.fetch({ limit: 100 })).values()).find(message => message.embeds[0]?.description.includes(memberUuid));
}