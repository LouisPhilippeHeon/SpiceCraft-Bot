import { Events } from 'discord.js';
import * as HandleButton from '../actions/handle-button';
import * as Register from '../actions/register';
import * as Models from '../models';

const erreurCommandeText = 'Une erreur s\'est produite lors de l\'exécution de cette commande!';

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Models.InteractionWithCommands) {
		if (interaction.isButton()) {
			if (interaction.customId === 'inscription') await Register.handleInscriptionButtonClick(interaction);
			if (interaction.customId === 'cancel') await interaction.message.delete();
			if (interaction.customId === 'confirm-new-season') await HandleButton.confirmEndSeason(interaction);
			if (interaction.customId.startsWith('confirm-reject')) await HandleButton.confirmRejectUser(interaction);
			if (interaction.customId.startsWith('approve')) await HandleButton.approveUser(interaction);
			if (interaction.customId.startsWith('reject')) await HandleButton.rejectUser(interaction);
			if (interaction.customId.startsWith('update')) await HandleButton.confirmUsernameChange(interaction);
			if (interaction.customId.startsWith('delete')) await HandleButton.deleteUser(interaction);
		}

		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`Aucune commande ne corresponsant à ${interaction.commandName} n'a été trouvée.`);
			return;
		}

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: erreurCommandeText, ephemeral: true });
			}
			else {
				await interaction.reply({ content: erreurCommandeText, ephemeral: true });
			}
		}
	}
}