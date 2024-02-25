import { inscriptionStatus } from '../../bot-constants';
import { createUser, getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { strings } from '../../strings/strings';
import { addPlayerRole, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new SlashCommandBuilder()
	.setName('ajouter-membre')
	.setDescription(strings.Commands.approve.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(strings.Commands.addMember.memberOptionDescription)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('username-minecraft')
			  .setDescription(strings.Commands.addMember.usernameMinecraftOptionDescription)
			  .setMinLength(3)
			  .setMaxLength(16)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('statut')
			  .setDescription(strings.Commands.addMember.statusOptionDescription)
			  .addChoices(
				  { name: 'Approuvé', value: inscriptionStatus.approved.toString() },
				  { name: 'Rejeté', value: inscriptionStatus.rejected.toString() },
				  { name: 'En attente', value: inscriptionStatus.awaitingApproval.toString() }
			  ))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(strings.Commands.addMember.silentOptionDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getUser('membre').id;
	const usernameMinecraft = interaction.options.getString('username-minecraft');
	const status = interaction.options.getString('statut') ? Number(interaction.options.getString('statut')) : inscriptionStatus.approved;
	const silent = interaction.options.getBoolean('silencieux');
	
	try {
		await getUserByDiscordUuid(discordUuid);
		await interaction.reply(strings.Commands.addMember.alreadyInDatabase);
	}
	catch {
		await saveNewUser(interaction, discordUuid, usernameMinecraft, status, silent);
	}
}

async function saveNewUser(interaction: ChatInputCommandInteraction, discordUuid: string, usernameMinecraft: string, status: number, silent: boolean) {
	try {
		const member = await fetchGuildMember(interaction.guild, discordUuid);

		const userFromMojangApi = await getMojangUser(usernameMinecraft);
		const user = await createUser(discordUuid, userFromMojangApi.id, status);

		let rconFailure: boolean = false;

		if (status === inscriptionStatus.approved) {
			await addPlayerRole(member);
			await user.addToWhitelist().catch(() => rconFailure = true);
		}

		const sendDm = !silent && status !== inscriptionStatus.awaitingApproval;
		if (sendDm && !rconFailure)
			await sendMessageToMember(getMessageToSendToUser(status), member, interaction, undefined, template(strings.Commands.addMember.successNoDm, {discordUuid: discordUuid}));
		
		const replyMessage = template((sendDm && rconFailure) ? strings.Commands.addMember.successNoDm : strings.Commands.addMember.success, {discordUuid: discordUuid});
		await interaction.reply({ content: replyMessage, ephemeral: true });
	}
	catch (e) {
		await interaction.reply({ content: e.message, ephemeral: true });
	}
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved)
		return strings.Commands.addMember.dmApproved;
	if (status === inscriptionStatus.rejected)
		return strings.Commands.addMember.dmRejected;
}