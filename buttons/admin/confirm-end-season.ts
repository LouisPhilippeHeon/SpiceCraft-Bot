import { drop, getUsers } from '../../services/database';
import { ButtonInteraction, PermissionFlagsBits } from 'discord.js';
import { info } from '../../services/logger';
import { ButtonData } from '../../models';
import { strings } from '../../strings/strings';
import { fetchBotChannel, fetchPlayerRole } from '../../utils';

export const data = new ButtonData('confirm-end-season', PermissionFlagsBits.Administrator);

let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
	interaction = buttonInteraction;
	await interaction.message.edit({ content: strings.Commands.endSeason.seasonEnded, components: [] });
	await sendBackupToInteractionAuthor();

	await interaction.reply({ content: strings.Commands.endSeason.newSeasonBegins, ephemeral: true });
	await drop();

	const playerRole = await fetchPlayerRole(interaction.guild, false);
	if (playerRole) await playerRole.delete();

	const botChannel = await fetchBotChannel(interaction.guild, false);
	if (botChannel) await botChannel.delete();
}

async function sendBackupToInteractionAuthor() {
	const users = await getUsers();

	if (users.length < 0) return;

	const json = JSON.stringify(users);
	const file = { attachment: Buffer.from(json), name: strings.Commands.endSeason.saveFilename };
	await interaction.user.send({ files: [file] }).catch();
	info(json);
}