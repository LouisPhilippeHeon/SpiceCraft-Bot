import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message, Guild, User } from 'discord.js';
import * as Strings from '../strings';
import * as Models from '../models';
import * as Utils from '../utils';

export async function createApprovalRequest(user: User, guild: Guild, username: string) {
	const approve = new ButtonBuilder()
		.setCustomId(`approve-${user.id}`)
		.setLabel(Strings.embeds.components.approve)
		.setStyle(ButtonStyle.Success);

	const reject = new ButtonBuilder()
		.setCustomId(`reject-${user.id}`)
		.setLabel(Strings.embeds.components.reject)
		.setStyle(ButtonStyle.Danger);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Strings.embeds.titles.approvalRequest.replace('$discordUsername$', user.username))
		.setDescription(Strings.embeds.descriptions.approvalRequest.replace('$discordUuid$', user.id).replace('$username$', username))
		.setThumbnail(user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, reject);

	await (await Utils.fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
}

export async function createUsernameChangeRequest(user: User, guild: Guild, userFromMojangApi: Models.UserFromMojangApi) {
	const approve = new ButtonBuilder()
		.setCustomId(`update-${user.id}-${userFromMojangApi.id}`)
		.setLabel(Strings.embeds.components.approve)
		.setStyle(ButtonStyle.Success);

	const ignore = new ButtonBuilder()
		.setCustomId('dissmiss')
		.setLabel(Strings.embeds.components.doNotUpdate)
		.setStyle(ButtonStyle.Secondary);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Strings.embeds.titles.usernameChangeRequest.replace('$discordUsername$', user.username))
		.setDescription(Strings.embeds.descriptions.usernameChangeRequest.replace('$discordUuid$', user.id).replace('$username$', userFromMojangApi.name))
		.setThumbnail(user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	(await Utils.fetchBotChannel(guild)).send({ embeds: [approvalRequestEmbed], components: [row] });
};

export async function findApprovalRequestOfMember(guild: Guild, memberUuid: string): Promise<Message> {
	const whitelistChannel = await Utils.fetchBotChannel(guild);
	return Array.from((await whitelistChannel.messages.fetch({ limit: 100 })).values()).find(message => message.embeds[0]?.description.includes(memberUuid));
}