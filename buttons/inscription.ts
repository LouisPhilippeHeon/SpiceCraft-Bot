import * as DatabaseService from '../services/database';
import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, Message } from 'discord.js';
import * as Constants from '../bot-constants';
import { ButtonData, UserFromDb, UserFromMojangApi } from '../models';
import { getMojangUser } from '../services/http';
import * as Utils from '../utils';
import * as AdminApprovalService from '../services/admin-approval';
import { ephemeralInteractions } from '../ephemeral-interactions';

export const data = new ButtonData('inscription');

let dmChannel: DMChannel;
let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;

export async function inscription(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    await DatabaseService.getUserByDiscordUuid(interaction.user.id).then(async (user) => {
        if (user.inscription_status === Constants.inscriptionStatus.rejected)
            await interaction.reply({ content: Strings.services.registering.adminsAlreadyDeniedRequest, ephemeral: true });
        else
            await updateExistingUser(user);
    }).catch(async () => await askIfFistTimeUser());
}

async function askIfFistTimeUser() {
    // Avoid having mutiple of these messages, because it means user could go to register process multiple times
    if (ephemeralInteractions.get(interaction.user.id)) {
        await (ephemeralInteractions.get(interaction.user.id).deleteReply());
        ephemeralInteractions.delete(interaction.user.id);
    }

    const firstTime = new ButtonBuilder({
        customId: 'register_true',
        label: Strings.components.buttons.yes,
        style: ButtonStyle.Secondary
    });

    const notFirstTime = new ButtonBuilder({
        customId: 'register_false',
        label: Strings.components.buttons.no,
        style: ButtonStyle.Secondary
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(firstTime, notFirstTime);
    await interaction.reply(({ content: Strings.events.register.askIfFirstTimePlaying, components: [row], ephemeral: true }));

    ephemeralInteractions.set(interaction.user.id, interaction);
}

async function updateExistingUser(userFromDb: UserFromDb) {
    try {
        const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsNewMinecraftUsername);
        dmChannel = usernameMessage.channel as DMChannel;
    }
	catch (e) {
        await interaction.reply({ content: Strings.services.registering.dmsAreClosed, ephemeral: true });
        return;
    }

    await interaction.reply({ content: Strings.services.registering.messageSentInDms, ephemeral: true });

    const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
    const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
    if (usernameCollected.size === 0) {
        await dmChannel.send(Strings.services.registering.timeoutAnswer);
        return;
    }

    let usernameSentByUser: string = usernameCollected.first().content;

    try {
        userFromMojangApi = await getMojangUser(usernameSentByUser);

        if (userFromDb.minecraft_uuid == userFromMojangApi.id) {
            await dmChannel.send(Strings.services.registering.sameMinecraftAccountAsBefore);
            return;
        }

        // User awaiting approval, edit approval request instead of creating another request
        if (userFromDb.inscription_status !== Constants.inscriptionStatus.approved) {
            await DatabaseService.changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
            await updateAdminApprovalRequest();
            return;
        }

        // Looks for another user with the same Minecraft UUID
        if (await DatabaseService.getUserByMinecraftUuid(userFromMojangApi.id))
            await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
        else {
            await AdminApprovalService.createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
            await dmChannel.send(Strings.services.registering.usernameUpdated);
        }
    }
	catch (e) {
        if (e.message === Strings.errors.api.noMojangAccountWithThatUsername)
            await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
        else
            await dmChannel.send(e.message);
    }
}

async function updateAdminApprovalRequest() {
    const whitelistChannel = await Utils.fetchBotChannel(interaction.guild);
    // Find approval request for the user in the whitelist channel
    const approvalRequest = await AdminApprovalService.findApprovalRequestOfMember(interaction.guild, interaction.user.id);
    // If message is too old to be updated
    if (!approvalRequest) {
        await whitelistChannel.send(
            Strings.services.registering.awaitingApprovalUserChangedMinecraftUsername
				.replace('$discordUuid$', interaction.user.id.toString())
				.replace('$minecraftUsername$', userFromMojangApi.name)
        );
    }
	else {
        const embedToUpdate = Utils.deepCloneWithJson(approvalRequest.embeds[0]);

        embedToUpdate.description = Strings.services.registering.embedDescription
			.replace('$discordUuid$', interaction.user.id)
			.replace('$minecraftUsername$', userFromMojangApi.name);

        await approvalRequest.edit({ embeds: [embedToUpdate] });
    }

    await dmChannel.send(Strings.services.registering.requestSucessfullyUpdated);
}