import * as Strings from '../strings';
import { client } from '../bot-constants';
import { formatDate } from '../utils';
import { UserFromDb } from '../models';

let rows = '';

export function buildHtml(users: UserFromDb[]) {
    users.forEach(userFromDb => {
        const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);

        rows += Strings.services.html.rowTemplate
            .replaceAll('$username$', user.username)
            .replace('$imgUrl$', user.displayAvatarURL({ size: 128 }))
            .replaceAll('$minecraftUuid$', userFromDb.minecraft_uuid)
            .replace('$status$', Strings.statusToEmoji(userFromDb.inscription_status))
            .replace('$createdAt$', formatDate(userFromDb.createdAt))
            .replace('$updatedAt$', formatDate(userFromDb.updatedAt));
    });
    return Strings.services.html.template.replace('$tableRows$', rows);
}