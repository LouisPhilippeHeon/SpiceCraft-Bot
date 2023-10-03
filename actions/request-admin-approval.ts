import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import * as Constants from '../bot-constants'

let discordUuid: string;

export async function sendApprovalRequest(interaction: any, username: string) {
	const whitelistChannel = interaction.channel.guild.channels.cache.find((channel: any) => channel.name === Constants.whitelistChannelName);
	discordUuid = interaction.user.id;

	const approve = new ButtonBuilder()
		.setCustomId(`approve-${discordUuid}`)
		.setLabel('Approuver')
		.setStyle(ButtonStyle.Success);

	const reject = new ButtonBuilder()
		.setCustomId(`reject-${discordUuid}`)
		.setLabel('Rejeter')
		.setStyle(ButtonStyle.Danger);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(`${interaction.user.username} veut être ajouté à la whitelist.`)
		.setThumbnail(interaction.user.displayAvatarURL({ size: 256, dynamic: true }));

	const row = new ActionRowBuilder().addComponents(approve, reject);

	approvalRequestEmbed.setDescription(`Compte Discord : <@${discordUuid}>.\nUsername Minecraft : ${username}.`);
	await whitelistChannel.send({ embeds: [approvalRequestEmbed], components: [row] });
};

export async function sendUsernameChangeRequest(interaction: any, username: string, minecraftUUid: string) {
	const whitelistChannel = interaction.channel.guild.channels.cache.find((channel: any) => channel.name === Constants.whitelistChannelName);
	discordUuid = interaction.user.id;

	const approve = new ButtonBuilder()
		.setCustomId(`update-${discordUuid}-${minecraftUUid}`)
		.setLabel('Approuver')
		.setStyle(ButtonStyle.Success);

	const approvalRequestEmbed = new EmbedBuilder()
		.setTitle(`${interaction.user.username} demande un changement de nom d'utilisateur.`)
		.setThumbnail(interaction.user.displayAvatarURL({ size: 256, dynamic: true }));

	const row = new ActionRowBuilder().addComponents(approve);

	approvalRequestEmbed.setDescription(`Compte Discord : <@${discordUuid}>.\nNouveau username Minecraft : ${username}.`);
	await whitelistChannel.send({ embeds: [approvalRequestEmbed], components: [row] });
};