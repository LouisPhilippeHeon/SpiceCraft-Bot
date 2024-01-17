import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, DMChannel, Message } from 'discord.js';
import { ButtonData, UserFromDb, UserFromMojangApi } from '../models';
import { getMojangUser } from '../services/http';
import { ephemeralInteractions } from '../ephemeral-interactions';
import { fetchBotChannel } from '../utils';
import { inscriptionStatus, timeToWaitForUserInputBeforeTimeout } from '../bot-constants';
import { changeMinecraftUuid, getUserByDiscordUuid, getUserByMinecraftUuid } from '../services/database';
import { createUsernameChangeRequest, editApprovalRequest, findApprovalRequestOfMember } from '../services/admin-approval';

const template = require('es6-template-strings');

export const data = new ButtonData('inscription');

let dmChannel: DMChannel;
let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;
    await getUserByDiscordUuid(interaction.user.id).then(async (user) => {
        if (user.inscription_status === inscriptionStatus.rejected)
            await interaction.reply({ content: Strings.services.registering.adminsAlreadyDeniedRequest, ephemeral: true });
        else
            await updateExistingUser(user);
    }).catch(async () => await askIfFistTimeUser());
}

async function askIfFistTimeUser() {
    // Avoid having mutiple of these messages, because it means user could start register process multiple times
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
    const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
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
        if (userFromDb.inscription_status === inscriptionStatus.awaitingApproval) {
            await changeMinecraftUuid(interaction.user.id, userFromMojangApi.id);
            await updateAdminApprovalRequest();
            return;
        }

        // Looks for another user with the same Minecraft UUID
        if (await getUserByMinecraftUuid(userFromMojangApi.id))
            await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
        else {
            await createUsernameChangeRequest(interaction.user, interaction.guild, userFromMojangApi);
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
    const whitelistChannel = await fetchBotChannel(interaction.guild);
    // Find approval request for the user in the whitelist channel
    const approvalRequest = await findApprovalRequestOfMember(interaction.guild, interaction.user.id);
    // If message is too old to be updated
    if (approvalRequest) {
        const description = template(Strings.services.registering.embedDescription, {
            discordUuid: interaction.user.id,
            minecraftUsername: userFromMojangApi.name
        });

        await editApprovalRequest(approvalRequest, undefined, description, undefined, undefined);
    }
	else {
        const message = template(Strings.services.registering.awaitingApprovalUserChangedMinecraftUsername, {
            discordUuid: interaction.user.id,
            minecraftUsername: userFromMojangApi.name
        });

        await whitelistChannel.send(message);
    }

    await dmChannel.send(Strings.services.registering.requestSucessfullyUpdated);
}