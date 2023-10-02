import * as DatabaseService from '../services/database';
import * as Constants from '../bot-constants';

export async function editUserStatus(interaction: any, status: number) {
    const idToEdit = interaction.options.getUser('membre').id;

    interaction.guild.members.fetch(idToEdit, false).then(async (member: any) => {
        // Change status in database
        await DatabaseService.changeStatus(idToEdit, status);
        // Remove role on Discord
        let role = interaction.guild.roles.cache.find((r: any) => r.name.toLowerCase() == Constants.playerRoleName.toLowerCase());
        (status == Constants.inscriptionStatus.approved) ? await member.roles.add(role.id) : await member.roles.remove(role.id);

        if (status == Constants.inscriptionStatus.approved || status == Constants.inscriptionStatus.rejected) {
            if (!interaction.options.getBoolean('silencieux')) member.send(getMessageSentToUser(status));
        }
        interaction.reply(getInteractionReplyMessage(status, idToEdit));
    }).catch((e: any) => {
        interaction.reply('Cet utilisateur n\'a jamais complété le formulaire d\'inscription !');
    });
}

function getMessageSentToUser(status: number): string {
    if (status == Constants.inscriptionStatus.approved) return `Tu a été ajouté à la whitelist de SpiceCraft.`
    if (status == Constants.inscriptionStatus.rejected) return `Tu a été retiré de la whitelist de SpiceCraft. Contacte les administrateurs pour plus de détails.`
}

function getInteractionReplyMessage(status: number, discordUuid:string): string {
    if (status == Constants.inscriptionStatus.approved) return `Le statut de <@${discordUuid}> à été changé pour "approuvé".`
    if (status == Constants.inscriptionStatus.rejected) return `Le statut de <@${discordUuid}> à été changé pour "rejeté".`
    if (status == Constants.inscriptionStatus.awaitingApproval) return `Le statut de <@${discordUuid}> à été changé pour "en attente".`
}