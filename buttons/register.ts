import * as Constants from '../bot-constants';
import * as HttpService from '../services/http';
import * as DatabaseService from '../services/database';
import * as AdminApprovalService from '../services/admin-approval';
import * as Strings from '../strings';
import * as Models from '../models';
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, DMChannel, EmbedBuilder, Message, MessageReaction, User } from 'discord.js';
import { ButtonData } from '../models';
import { ephemeralInteractions } from '../ephemeral-interactions';

export const data = new ButtonData('register');

const rulesEmbed = new EmbedBuilder({
    color: 0x0099FF,
    title: Strings.components.titles.rules,
    description: Strings.components.descriptions.rules
});

let userFromMojangApi: Models.UserFromMojangApi;
let interaction: ButtonInteraction;
let dmChannel: DMChannel;
let userThatInvited: string = null;

export async function register(interaction: ButtonInteraction) {
    const argument = interaction.customId.split('_')[1];
    const interactionWithEphemeral = ephemeralInteractions.get(interaction.user.id);

    // Disable buttons and style the one that was clicked
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

    ephemeralInteractions.delete(interaction.user.id);
    await registerUser(interaction, (argument === 'false'));
}

export async function registerUser(buttonInteraction: ButtonInteraction, isFirstTimeMember: boolean) {
    interaction = buttonInteraction;

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
    const usernameCollected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });

    if (usernameCollected.size === 0) {
        await dmChannel.send(Strings.services.registering.timeoutAnswer);
        return;
    }

    let usernameSentByUser: string = usernameCollected.first().content;

    try {
        userFromMojangApi = await HttpService.getMojangUser(usernameSentByUser);

        if (isFirstTimeMember) {
            await askWhoInvited();
            await getRulesAcknowledgment();
        }

        await saveNewUserToDb();
    }
	catch (e) {
        if (e.message === Strings.errors.api.noMojangAccountWithThatUsername)
            await dmChannel.send(Strings.services.registering.minecraftAccountDoesNotExist.replace('$minecraftUsername$', usernameSentByUser));
        else
            await dmChannel.send(e.message);
    }
}

async function askWhoInvited() {
    await dmChannel.send(Strings.services.registering.askWhoInvitedNewPlayer);

    // Collect answer
    const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
    const collected = await dmChannel.awaitMessages({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
    if (collected.size === 0) throw new Error (Strings.services.registering.timeoutAnswer);

    userThatInvited = collected.first().content;
}

async function getRulesAcknowledgment() {
    const rulesMessage = await dmChannel.send({ content: Strings.services.registering.reactToAcceptRules, embeds: [rulesEmbed] });
    await rulesMessage.react('✅');

    // Collect emoji reactions
    const collectorFilter = (reaction: MessageReaction, user: User) =>  (reaction.emoji.name === '✅') && (user.id === interaction.user.id);
    const emojisCollected = await rulesMessage.awaitReactions({ filter: collectorFilter, max: 1, time: Constants.timeToWaitForUserInputBeforeTimeout });
    if (emojisCollected.size === 0) throw new Error(Strings.services.registering.timeoutAnswer);
}

async function saveNewUserToDb() {
    try {
        await DatabaseService.createUser(userFromMojangApi.id, interaction.user.id);
        await AdminApprovalService.createApprovalRequest(interaction.user, interaction.guild, userFromMojangApi.name, userThatInvited);
        await dmChannel.send(Strings.services.registering.waitForAdminApprobation);
    }
	catch (e) {
        if (e.message === Strings.errors.database.notUnique)
            await dmChannel.send(Strings.errors.usernameUsedWithAnotherAccount);
        else
            await dmChannel.send(e.message);
    }
}