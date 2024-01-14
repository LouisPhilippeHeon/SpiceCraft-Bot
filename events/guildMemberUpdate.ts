import * as Strings from '../strings';
import { AuditLogEvent, Events, GuildMember } from 'discord.js';
import { clientId } from '../config';
import { playerRoleName } from '../bot-constants';
import { deleteEntry } from '../services/database';

module.exports = {
	name: Events.GuildMemberUpdate,
	once: false,
	async execute(oldMember: GuildMember, newMember: GuildMember) {
		const oldMemberWasPlayer = oldMember.roles.cache.some(role => role.name === playerRoleName);
		const newMemberIsPlayer = newMember.roles.cache.some(role => role.name === playerRoleName);

		if (oldMemberWasPlayer && !newMemberIsPlayer) {
			try {
				const latestMemberRoleUpdateLog = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
				const executor = latestMemberRoleUpdateLog.entries.first().executor;

				if (executor.id !== clientId)
					await deleteEntry(newMember.user.id);
			}
			catch (e) {
				if (e.code === 50013) console.error(Strings.errors.cantReadLogs);
				else console.error(e);
			}
		}
	}
}