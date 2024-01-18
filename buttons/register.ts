import * as Strings from '../strings';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { ButtonData, UserFromMojangApi } from '../models';
import { ephemeralInteractions } from '../ephemeral-interactions';
import { createUser } from '../services/database';
import { createApprovalRequest } from '../services/admin-approval';
import { getMojangUser } from '../services/http';
import { timeToWaitForUserInputBeforeTimeout } from '../bot-constants';

const template = require('es6-template-strings');

export const data = new ButtonData('register');

const rulesEmbed = new EmbedBuilder({
    color: 0x0099FF,
    title: Strings.components.titles.rules,
    description: Strings.components.descriptions.rules
});

let userFromMojangApi: UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userThatInvited: string = null;

export async function execute(buttonInteraction: ButtonInteraction) {
    interaction = buttonInteraction;

    const argument = interaction.customId.split('_')[1];

    // Disable buttons and style the one that was clicked
    await disableButtons();

    ephemeralInteractions.delete(interaction.user.id);
    await registerUser(argument === 'false');
}

async function disableButtons() {
    const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

    if (interactionWithEphemeral) {
        let components = (await interactionWithEphemeral.fetchReply()).components[0].components;
        const row = new ActionRowBuilder<ButtonBuilder>();

        components.forEach((component: ButtonComponent) => {
            const wasClicked = component.customId === interaction.customId;

            const newComponent = new ButtonBuilder({
                customId: component.customId,
                label: component.label,
                style: (wasClicked) ? ButtonStyle.Primary : component.style,
                disabled: true
            });

            row.addComponents(newComponent);
        });
        await interactionWithEphemeral.editReply({ components: [row] });
    }
}

async function registerUser(isFirstTimeMember: boolean) {
    try {
        const usernameMessage = await interaction.user.send(Strings.services.registering.askWhatIsMinecraftUsername);
        dmChannel = usernameMessage.channel as DMChannel;
    }
	catch(e) {
        await interaction.reply({content: Strings.services.registering.dmsAreClosed, ephemeral: true});
        return;
    }

    const replyMessage = isFirstTimeMember
		? Strings.services.registering.messageSentInDmsNewUser
    	: Strings.services.registering.messageSentInDms;

    await interaction.reply({ content: replyMessage, ephemeral: true });

    // Collect message sent by user
    const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
    const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });

    if (usernameCollected.size === 0) {
        await dmChannel.send(Strings.services.registering.timeoutAnswer);
        return;
    }

    let usernameSentByUser: string = usernameCollected.first().content;

    try {
        userFromMojangApi = await getMojangUser(usernameSentByUser);

        if (isFirstTimeMember) {
            await askWhoInvited();
            await getRulesAcknowledgment();
        }

        await saveNewUserToDb();
    }
	catch (e) {
        if (e.message === Strings.errors.api.noMojangAccountWithThatUsername)
            await dmChannel.send(template(Strings.services.registering.minecraftAccountDoesNotExist, {minecraftUsername: usernameSentByUser}));
        else
            await dmChannel.send(e.message);
    }
}

async function askWhoInvited() {
    await dmChannel.send(Strings.services.registering.askWhoInvitedNewPlayer);

    // Collect answer
    const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
    const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
    if (collected.size === 0) throw new Error (Strings.services.registering.timeoutAnswer);

    userThatInvited = collected.first().content;
}

async function getRulesAcknowledgment() {
    const rulesMessage = await dmChannel.send({ content: Strings.services.registering.reactToAcceptRules, embeds: [rulesEmbed] });
    await rulesMessage.react('✅');

    // Collect emoji reactions
    const collectorFilter = (reaction: MessageReaction, user: User) =>  (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
    const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: timeToWaitForUserInputBeforeTimeout });
    if (emojisCollected.size === 0) throw new Error(Strings.services.registering.timeoutAnswer);
}

async function saveNewUserToDb() {
    try {
        await createUser(userFromMojangApi.id, interaction.user.id);
        await createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
        await dmChannel.send(Strings.services.registering.waitForAdminApprobation);
    }
	catch (e) {
        if (e.message === Strings.errors.database.notUnique)
            await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
        else
            await dmChannel.send(e.message);
    }
}