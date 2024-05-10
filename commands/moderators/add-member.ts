import { inscriptionStatus } from '../../bot-constants';
import { createUser, getUserByDiscordUuid } from '../../services/database';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SpiceCraftError } from '../../models/error';
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
			  .setChoices(
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
	const member = await fetchGuildMember(interaction.guild, discordUuid);
	const userFromMojangApi = await getMojangUser(usernameMinecraft);
	const userFromDb = await createUser(discordUuid, userFromMojangApi.id, status);

	if (status === inscriptionStatus.approved) {
		await addPlayerRole(member);
		try {
			await userFromDb.addToWhitelist();
		}
		catch {
			throw new SpiceCraftError(template(Commands.addMember.rconFailedManualInterventionRequired, {discordUuid: discordUuid}))
		}
	}

	const messageOnSuccess = template(Commands.addMember.success, {discordUuid: discordUuid});
	const messageOnFailure = template(Commands.addMember.successDmFailed, {discordUuid: discordUuid});

	if (!silent && status !== inscriptionStatus.awaitingApproval)
		await sendMessageToMember(getMessageToSendToUser(status), member, interaction, messageOnSuccess, messageOnFailure);
	else
		await interaction.reply(messageOnSuccess);
}

function getMessageToSendToUser(status: number): string {
	if (status === inscriptionStatus.approved) return Commands.addMember.dmApproved;
	if (status === inscriptionStatus.rejected) return Commands.addMember.dmRejected;
}