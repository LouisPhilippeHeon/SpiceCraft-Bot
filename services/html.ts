import * as Models from '../models';
import * as Utils from '../utils';
import * as Texts from '../texts';

export function buildHtml(users: Models.UserFromDb[]) {
    let rows = "";
    users.forEach(userFromDb => {
        let user = Utils.client.users.cache.find(user => user.id == userFromDb.discord_uuid);

        rows += Texts.services.html.rowTemplate
            .replaceAll('$username$', user.username)
            .replace('$imgUrl$', user.displayAvatarURL({ size: 128 }))
            .replaceAll('$minecraftUuid$', userFromDb.minecraft_uuid)
            .replace('$status$', Texts.statusToEmoji(userFromDb.inscription_status))
            .replace('$createdAt$', Utils.formatDate(userFromDb.createdAt))
            .replace('$updatedAt$',  Utils.formatDate(userFromDb.updatedAt));
    });
    return Texts.services.html.template.replace('$tableRows$', rows);
}