import * as DatabaseService from '../services/database';
import * as Constants from '../bot-constants';
import * as Texts from '../texts'

export async function editUserStatus(interaction: any, status: number) {
    const idToEdit = interaction.options.getUser('membre').id;

    interaction.guild.members.fetch(idToEdit, false).then(async (member: any) => {
        // Change status in database
        await DatabaseService.changeStatus(idToEdit, status);
        // Remove role on Discord
        let role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
        (status == Constants.inscriptionStatus.approved) ? await member.roles.add(role.id) : await member.roles.remove(role.id);

        if (!interaction.options.getBoolean('silencieux') && status !== Constants.inscriptionStatus.awaitingApproval) {
            const interactionReplyMessage = Texts.editUserStatus.statusChanged.replace('$discordUuid$', idToEdit).replace('$status$', Texts.getStatusName(status));
            try {
                await member.send(getMessageToSendToUser(status));
                await interaction.reply(interactionReplyMessage);
            }
            catch {
                await interaction.reply(interactionReplyMessage + '\n' + Texts.editUserStatus.cantSendDm);
            }
        }
    }).catch(async (e: any) => {
        await interaction.reply(e.message);
    });
}

function getMessageToSendToUser(status: number): string {
    if (status == Constants.inscriptionStatus.approved) return Texts.editUserStatus.dmAddedToWhitelist;
    if (status == Constants.inscriptionStatus.rejected) return Texts.editUserStatus.dmRemovedFromWhitelist;
}