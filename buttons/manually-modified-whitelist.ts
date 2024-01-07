import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import * as Utils from '../utils';
import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import { ButtonData } from '../models';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

let member;

export async function manuallyModifiedWhitelist(interaction: ButtonInteraction) {
   const discordUuid = interaction.customId.split('_')[1];
   const minecraftUuid = interaction.customId.split('_')[2];

   try {
      member = await Utils.fetchGuildMember(interaction.guild, discordUuid);
      await DatabaseService.changeMinecraftUuid(discordUuid, minecraftUuid);
   }
	catch (e) {
      await interaction.reply({ content: e.message, ephemeral: true });
      await interaction.message.delete();
      return;
   }
   
   await updateMessage(interaction);
   await notifyMember(member, interaction, discordUuid);
}

async function updateMessage(interaction: ButtonInteraction) {
   const embedToUpdate = Utils.deepCloneWithJson(interaction.message.embeds[0]);
   embedToUpdate.color = Colors.Green;
   await interaction.message.edit({ content: Strings.events.usernameChangeConfirmation.messageUpdate.replace('$discordUuid$', interaction.user.id), embeds: [embedToUpdate], components: [] });
}

async function notifyMember(member: GuildMember, interaction: ButtonInteraction, discordUuid: string) {
   try {
      await member.send(Strings.events.usernameChangeConfirmation.messageSentToConfirmUsernameChange);
      await interaction.reply({ content: Strings.events.usernameChangeConfirmation.success.replace('$discordUuid$', discordUuid), ephemeral: true });
   }
	catch {
      await interaction.reply({ content: Strings.events.usernameChangeConfirmation.successNoDm.replace('$discordUuid$', discordUuid), ephemeral: true });
   }
}