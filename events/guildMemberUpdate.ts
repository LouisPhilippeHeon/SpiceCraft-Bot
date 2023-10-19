import { AuditLogEvent, Events, GuildMember } from 'discord.js';
import * as Constants from '../bot-constants'
import * as DatabaseService from '../services/database'
import { clientId } from '../config';

module.exports = {
	name: Events.GuildMemberUpdate,
	once: false,
	async execute(oldMember: GuildMember, newMember: GuildMember) {
		if (oldMember.roles.cache.some(role => role.name === Constants.playerRoleName) && !newMember.roles.cache.some(role => role.name === Constants.playerRoleName)) {
			try {
				const latestMemberRoleUpdateLog = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
				const executor = newMember.guild.members.resolve(latestMemberRoleUpdateLog.entries.first().executor);
				if (executor.user.id !== clientId) await DatabaseService.deleteEntry(newMember.user.id);
			}
			catch (e) {
				if (e.code === 50013) console.log('Le bot a besoin de permission pour lire les logs.');
			}
		}
	}
}