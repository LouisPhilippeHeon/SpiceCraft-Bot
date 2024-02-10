import { playerRoleName } from '../bot-constants';
import { clientId } from '../config';
import { deleteEntry } from '../services/database';
import { AuditLogEvent, Events, GuildMember } from 'discord.js';
import { error, info } from '../services/logger';
import { Errors, Logs } from '../strings';
import { template } from '../utils';

module.exports = {
	name: Events.GuildMemberUpdate,
	once: false,
	async execute(oldMember: GuildMember, newMember: GuildMember) {
		const oldMemberWasPlayer = oldMember.roles.cache.some(role => role.name === playerRoleName);
		const newMemberIsPlayer = newMember.roles.cache.some(role => role.name === playerRoleName);

		if (oldMemberWasPlayer && !newMemberIsPlayer) {
			info(template(Logs.playerRoleWasRemoved, {username: newMember.user.username}));

			try {
				const latestMemberRoleUpdateLog = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
				const executor = latestMemberRoleUpdateLog.entries.first().executor;

				if (executor.id !== clientId)
					await deleteEntry(newMember.user.id);
			}
			catch (e) {
				if (e.code === 50013) error(Errors.discord.cantReadLogs);
				else error(e);
			}
		}
	}
}