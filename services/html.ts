import { client } from '../bot-constants';
import { UserFromDb } from '../models';
import { getStatusName, Services, statusToEmoji } from '../strings';
import { template } from '../utils';

export function buildHtml(users: UserFromDb[], status?: number) {
	let rows = '';

	users.forEach(userFromDb => {
		const user = client.users.cache.find(user => user.id === userFromDb.discord_uuid);
		const rowTemplate = status === undefined ? Services.html.rowTemplate : Services.html.rowTemplateWithStatus;
		const row = template(rowTemplate, {
			username: user ? user.username : userFromDb.discord_uuid,
			imgUrl: user? user.displayAvatarURL({ size: 128 }) : null,
			minecraftUuid: userFromDb.minecraft_uuid,
			status: status === undefined ? statusToEmoji(userFromDb.inscription_status) : undefined,
			createdAt: formatDate(userFromDb.createdAt),
			updatedAt: formatDate(userFromDb.updatedAt)
		});
		rows = rows.concat(row);
	});

	if (status === undefined)
		return template(Services.html.template, {table: rows, memberCount: users.length});
	else
		return template(Services.html.templateWithStatus, {status: getStatusName(status), table: rows, memberCount: users.length});
}

function formatDate(dateToFormat: Date): string {
	const parts = dateToFormat.toString().split(' ');
	const datePart = parts[0];
	const timePart = parts[1];

	const dateParts = datePart.split('-');
	const year = Number(dateParts[0]);
	const month = Number(dateParts[1]);
	const day = Number(dateParts[2]);

	const timeParts = timePart.split(':');
	const hours = Number(timeParts[0]);
	const minutes = Number(timeParts[1]);

	const date = new Date(year, month - 1, day, hours, minutes);

	const options = {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	} as Intl.DateTimeFormatOptions;

	return date.toLocaleDateString('fr-FR', options);
}