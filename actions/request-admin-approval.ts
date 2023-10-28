import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction } from 'discord.js';
import * as Texts from '../texts';
import * as Models from '../models';
import * as Utils from '../utils';

let discordUuid: string;

export async function sendApprovalRequest(interaction: ButtonInteraction, username: string) {
	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	discordUuid = interaction.user.id;

	const approve = new ButtonBuilder()
		.setCustomId(`approve-${discordUuid}`)
		.setLabel(Texts.embeds.components.approve)
		.setStyle(ButtonStyle.Success);

	const reject = new ButtonBuilder()
		.setCustomId(`reject-${discordUuid}`)
		.setLabel(Texts.embeds.components.reject)
		.setStyle(ButtonStyle.Danger);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Texts.embeds.titles.approvalRequest.replace('$discordUsername$', interaction.user.username))
		.setDescription(Texts.embeds.descriptions.approvalRequest.replace('$discordUuid$', discordUuid).replace('$username$', username))
		.setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, reject);

	await whitelistChannel.send({ embeds: [approvalRequestEmbed], components: [row] });
};

export async function sendUsernameChangeRequest(interaction: ButtonInteraction, userFromMojangApi: Models.UserFromMojangApi) {
	const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
	discordUuid = interaction.user.id;

	const approve = new ButtonBuilder()
		.setCustomId(`update-${discordUuid}-${userFromMojangApi.id}`)
		.setLabel(Texts.embeds.components.approve)
		.setStyle(ButtonStyle.Success);

	const ignore = new ButtonBuilder()
		.setCustomId('dissmiss')
		.setLabel(Texts.embeds.components.doNotUpdate)
		.setStyle(ButtonStyle.Secondary);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(Texts.embeds.titles.usernameChangeRequest.replace('$discordUsername$', interaction.user.username))
		.setDescription(Texts.embeds.descriptions.usernameChangeRequest.replace('$discordUuid$', discordUuid).replace('$username$', userFromMojangApi.name))
		.setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approve, ignore);

	await whitelistChannel.send({ embeds: [approvalRequestEmbed], components: [row] });
};