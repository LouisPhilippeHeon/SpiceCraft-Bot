import { client } from '../bot-constants';
import { UserFromDb } from '../models';
import { Services, statusToEmoji } from '../strings';
import { formatDate, template } from '../utils';

let rows = '';

export function buildHtml(users: UserFromDb[]) {
	users.forEach(userFromDb => {
		const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);

		rows += template(Services.html.rowTemplate, {
			username: user.username,
			imgUrl: user.displayAvatarURL({ size: 128 }),
			minecraftUuid: userFromDb.minecraft_uuid,
			status: statusToEmoji(userFromDb.inscription_status),
			createdAt: formatDate(userFromDb.createdAt),
			updatedAt: formatDate(userFromDb.updatedAt)
		});
	});

	return template(Services.html.template, {nbJoueurs: users.length, tableRows: rows});
}