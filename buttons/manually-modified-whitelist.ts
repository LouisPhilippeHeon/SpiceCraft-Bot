import { ButtonInteraction, Colors, GuildMember, PermissionFlagsBits } from 'discord.js';
import * as Strings from '../strings';
import { ButtonData } from '../models';
import { changeMinecraftUuid } from '../services/database';
import { deepCloneWithJson, fetchGuildMember } from '../utils';

export const data = new ButtonData('manually-modified-whitelist', PermissionFlagsBits.BanMembers);

let member;

export async function execute(interaction: ButtonInteraction) {
   const discordUuid = interaction.customId.split('_')[1];
   const minecraftUuid = interaction.customId.split('_')[2];

   try {
      member = await fetchGuildMember(interaction.guild, discordUuid);
      await changeMinecraftUuid(discordUuid, minecraftUuid);
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
   const embedToUpdate = deepCloneWithJson(interaction.message.embeds[0]);
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