import { AuditLogEvent, Events, GuildMember } from 'discord.js';
import * as Constants from '../bot-constants';
import * as DatabaseService from '../services/database';
import { clientId } from '../config';

module.exports = {
	name: Events.GuildMemberUpdate,
	once: false,
	async execute(oldMember: GuildMember, newMember: GuildMember) {
		const oldMemberWasPlayer = oldMember.roles.cache.some(role => role.name === Constants.playerRoleName);
		const newMemberIsPlayer = newMember.roles.cache.some(role => role.name === Constants.playerRoleName);

		if (oldMemberWasPlayer && !newMemberIsPlayer) {
			try {
				const latestMemberRoleUpdateLog = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
				const executor = latestMemberRoleUpdateLog.entries.first().executor;

				if (executor.id !== clientId)
					await DatabaseService.deleteEntry(newMember.user.id);
			}
			catch (e) {
				if (e.code === 50013) console.error('Le bot n\'a pas la permission de lire les logs.');
				else console.error(e);
			}
		}
	}
}