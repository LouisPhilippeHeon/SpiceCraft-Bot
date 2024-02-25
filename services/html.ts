import { client } from '../bot-constants';
import { UserFromDb } from '../models';
import { strings } from '../strings/strings';
import { formatDate, template } from '../utils';

export function buildHtml(users: UserFromDb[], status?: number) {
	let rows = '';

	users.forEach(userFromDb => {
		const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);
		const rowTemplate = status === undefined ? strings.Services.html.rowTemplate : strings.Services.html.rowTemplateWithStatus;
		const row = template(rowTemplate, {
			username: user ? user.username : userFromDb.discord_uuid,
			imgUrl: user? user.displayAvatarURL({ size: 128 }) : null,
			minecraftUuid: userFromDb.minecraft_uuid,
			status: status === undefined ? strings.statusToEmoji(userFromDb.inscription_status) : undefined,
			createdAt: formatDate(userFromDb.createdAt),
			updatedAt: formatDate(userFromDb.updatedAt)
		});
		rows = rows.concat(row);
	});

	if (status === undefined)
		return template(strings.Services.html.template, {table: rows, memberCount: users.length});
	else
		return template(strings.Services.html.templateWithStatus, {status: strings.getStatusName(status), table: rows, memberCount: users.length});
}