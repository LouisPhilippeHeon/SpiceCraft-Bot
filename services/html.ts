import * as Strings from '../strings';
import { client } from '../bot-constants';
import { formatDate, template } from '../utils';
import { UserFromDb } from '../models';

let rows = '';

export function buildHtml(users: UserFromDb[]) {
    users.forEach(userFromDb => {
        const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);

        rows += template(Strings.services.html.rowTemplate, {
            username: user.username,
            imgUrl: user.displayAvatarURL({ size: 128 }),
            minecraftUuid: userFromDb.minecraft_uuid,
            status: Strings.statusToEmoji(userFromDb.inscription_status),
            createdAt: formatDate(userFromDb.createdAt),
            updatedAt: formatDate(userFromDb.updatedAt)
        });

    });
    return template(Strings.services.html.template, {tableRows: rows});
}