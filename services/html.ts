import { client } from '../bot-constants';
import { UserFromDb } from '../models';
import { getStatusName, Services, statusToEmoji } from '../strings';
import { formatDate, template } from '../utils';

export function buildHtml(users: UserFromDb[], status?: number) {
	let rows = '';

	users.forEach(userFromDb => {
		const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);

		if (status === undefined) {
			rows += template(Services.html.rowTemplate, {
				username: user.username,
				imgUrl: user.displayAvatarURL({ size: 128 }),
				minecraftUuid: userFromDb.minecraft_uuid,
				status: statusToEmoji(userFromDb.inscription_status),
				createdAt: formatDate(userFromDb.createdAt),
				updatedAt: formatDate(userFromDb.updatedAt)
			});
		}
		else {
			rows += template(Services.html.rowTemplateWithStatus, {
				username: user.username,
				imgUrl: user.displayAvatarURL({ size: 128 }),
				minecraftUuid: userFromDb.minecraft_uuid,
				createdAt: formatDate(userFromDb.createdAt),
				updatedAt: formatDate(userFromDb.updatedAt)
			});
		}
	});

	if (status === undefined)
		return template(Services.html.template, {table: rows, nbJoueurs: users.length});
	else
		return template(Services.html.templateWithStatus, {status: getStatusName(status), table: rows, nbJoueurs: users.length});
}