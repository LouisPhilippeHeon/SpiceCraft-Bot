import { inscriptionStatus } from '../../bot-constants';
import { createUser, getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getMojangUser } from '../../services/http';
import { Commands } from '../../strings';
import { addPlayerRole, fetchGuildMember, sendMessageToMember, template } from '../../utils';

export const data = new SlashCommandBuilder()
	.setName('ajouter-membre')
	.setDescription(Commands.approve.description)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.addUserOption(option =>
		option.setName('membre')
			  .setDescription(Commands.addMember.membreOptionDescription)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('username-minecraft')
			  .setDescription(Commands.addMember.usernameMinecraftOptionDescription)
			  .setMinLength(3)
			  .setMaxLength(16)
			  .setRequired(true))
	.addStringOption(option =>
		option.setName('statut')
			  .setDescription(Commands.addMember.statusOptionDescription)
			  .addChoices(
				  { name: 'Approuvé', value: inscriptionStatus.approved.toString() },
				  { name: 'Rejeté', value: inscriptionStatus.rejected.toString() },
				  { name: 'En attente', value: inscriptionStatus.awaitingApproval.toString() }
			  ))
	.addBooleanOption(option =>
		option.setName('silencieux')
			  .setDescription(Commands.addMember.silentOptionDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
	const discordUuid = interaction.options.getUser('membre').id;
	const usernameMinecraft = interaction.options.getString('username-minecraft');
	const status = interaction.options.getString('statut') ? Number(interaction.options.getString('statut')) : inscriptionStatus.approved;
	const silent = interaction.options.getBoolean('silencieux');
	
	try {
		await getUserByDiscordUuid(discordUuid);
		await interaction.reply(Commands.addMember.alreadyInDatabase);
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
			await sendMessageToMember(getMessageToSendToUser(status), member, interaction, undefined, template(Commands.addMember.successNoDm, {discordUuid: discordUuid}));
		
		const replyMessage = template((sendDm && rconFailure) ? Commands.addMember.successNoDm : Commands.addMember.success, {discordUuid: discordUuid});
		await interaction.reply({ content: replyMessage, ephemeral: true });
	}
	catch (e) {
		await interaction.reply({ content: e.message, ephemeral: true });
	}
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved)
		return Commands.addMember.dmApproved;
	if (status === inscriptionStatus.rejected)
		return Commands.addMember.dmRejected;
}