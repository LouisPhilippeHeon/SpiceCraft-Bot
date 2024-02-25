import { inscriptionStatus, playerRoleName, sessionServer, whitelistChannelName } from '../bot-constants';

export namespace ButtonEvents {
	export const clickToConfirmChangesToWhitelist = 'Click on the button when it\'s done, so that <@${discordUuid}> is informed of the change related to his request.';

	export enum approbation {
		changeWhitelistBeforeCliking = 'Don\'t forget to manually add the player to the whitelist BEFORE clicking the button!',
		messageSentToPlayerToConfirmInscription = 'You have been added to the whitelist. If you can\'t connect, your Minecraft username may be incorrect. If this is the case, click on the registration button again.',
		requestGranted = '✅ The request has been approved by <@${discordUuid}>.',
		success = 'A message has been sent to <@${discordUuid}> to inform him of his addition to the whitelist.',
		successNoDm = '<@${discordUuid}> has been added to the whitelist. However, his privacy settings prevent me from sending him a message to inform him.'
	}

	export enum ban {
		messageUpdate = '🔨 The player has been removed from the Minecraft server whitelist by <@${discordUuid}>.',
		reply = '<@${discordUuid}> has been successfully removed from the Minecraft server.'
	}

	export enum enrolling {
		adminsAlreadyDeniedRequest = '🚫 The administrators have already denied your request! 🚫',
		askIfFirstTimePlaying = 'Have you ever played on SpiceCraft?',
		askWhatIsMinecraftUsername = 'What is your Minecraft username?',
		askWhatIsNewMinecraftUsername = 'What is the correct username?',
		askWhoInvitedNewPlayer = 'Who invited you to SpiceCraft? Write down his Discord username.',
		awaitingApprovalUserChangedMinecraftUsername = '<@${discordUuid}> changed his Minecraft username to \`${minecraftUsername}\` in his whitelist addition request.',
		dmsAreClosed = 'Your privacy settings prevent me from sending you messages. Change these settings to continue.',
		embedDescription = 'Discord account: <@${discordUuid}>.\nMinecraft Username: \`${minecraftUsername}\`.',
		messageSentInDms = 'Please respond to the bot who sent you a private message!',
		messageSentInDmsNewUser = 'Welcome, we are happy to welcome you! Please respond to the bot who sent you a private message!',
		minecraftAccountDoesNotExist = '❌ The Minecraft account "${minecraftUsername}" does not exist! You can click the `Register` button again to try again. ❌',
		reactToAcceptRules = 'React with ✅ to indicate that you have read and accepted the rules.',
		requestSucessfullyUpdated = 'Your request has been successfully updated!',
		sameMinecraftAccountAsBefore = 'No need to update your username, as it is identical to the one associated with the Minecraft account in the whitelist.',
		usernameUpdated = 'Your username has been successfully changed, I will send you a message when the username will be updated in the whitelist.',
		waitForAdminApprobation = 'Your registration is awaiting approval by the administrators, I will send you a message when it is accepted!'
	}

	export enum rejection {
		messageSentToUserToInformRejection = 'Sorry, but the administrators have chosen not to add you to the whitelist. Contact them for more details.',
		requestDenied = '❌ The request has been denied by <@${discordUuid}>.',
		askConfirmation = 'Are you sure you want to reject <@${discordUuid}>?',
		success = 'A message has been sent to <@${discordUuid}> to inform him of the rejection.',
		successNoDm = '<@${discordUuid}> has been rejected. However, his privacy settings prevent me from sending him a message to inform him.',
		userStillInBdExplanation = 'This user is still in the database, with the status "rejected", so if he joins the server again, the bot remembers that <@${discordUuid}> is rejected. If you want to remove him, you can use the /delete-entry command'
	}

	export enum usernameChangeConfirmation {
		changeWhitelistBeforeCliking = 'N\'oublies pas de modifier manuellement la whitelist AVANT de cliquer sur le bouton !',
		messageUpdate = '✅ La mise à jour de username a été complétée (avec l\'autorisation de <@${discordUuid}>).',
		messageSentToConfirmUsernameChange = 'Ton username Minecraft a été mis à jour dans la whitelist.',
		success = 'Un message a été envoyé à <@${discordUuid}> pour l\'informer de la mise à jour du username.',
		successNoDm = 'Mise a jour du compte Minecraft de <@${discordUuid}> effectuée avec succès, dans la whitelist et la base de données. Cependant, ses paramètres de confidentialité m\'empêchent de lui envoyer un message afin de lui en informer.'
	}
}

export namespace Commands {
	export enum addMember {
		alreadyInDatabase = 'This user already exists in the database. If you want to modify the Minecraft account associated with it, use the `/modify-username` command.',
		dmApproved = 'An administrator has manually added you to the Minecraft server whitelist.',
		dmRejected = 'An administrator has manually rejected you from the Minecraft server whitelist.',
		memberOptionDescription = 'Member to register.',
		silentOptionDescription = 'Send a message to the user?',
		success = 'The profile of <@${discordUuid}> is added to the database!',
		successNoDm = 'The profile of <@${discordUuid}> is added to the database! However, it was impossible to send him a message due to his privacy settings.',
		statusOptionDescription = 'Status to assign to the member. If none is specified, it will be approved.',
		usernameMinecraftOptionDescription = 'Minecraft username of the player.'
	}

	export enum approve {
		description = 'Approve the member of the Minecraft server and add the player role on Discord.',
		memberOptionDescription = 'Member to approve',
		silentOptionDescription = 'Send a message to the approved user?'
	}

	export enum deleteEntry {
		description = 'Delete a row in the database.',
		messageUpdate = '🗑️ The user has been removed from the whitelist and the database.',
		removeFromWhitelistOption = 'Remove the player from the whitelist (default: Yes)?',
		reply = '<@${discordUuid}> has been successfully removed from the whitelist and the database.',
		userIdOption = 'Remove the entry for which Discord UUID?'
	}

	export enum findDiscordMember {
		description = 'Display a Discord server member associated with a Minecraft username.',
		usernameOptionDescription = 'Minecraft Username'
	}

	export enum findMinecraftMember {
		description = 'Displays the Minecraft username of a Discord server member.',
		userOptionDescription = 'Member whose Minecraft username should be displayed.'
	}

	export enum displayUsers {
		databaseEntryLine = '<@${discordUuid}> | [Display](<' + sessionServer + '/minecraft/profile/${minecraftUuid}>) | ${statusEmoji}\n',
		description = 'Displays registered users according to their status (optional).',
		displayingAllUsers = 'Displaying all users',
		displayingUsersWithStatus = 'Displaying users with the status "${status}"',
		filenameHtml = 'users.html',
		filenameJson = 'users.json',
		filenameJsonWithStatus = 'users_${status}.json',
		filenameHtmlWithStatus = 'users_${status}.html',
		formatOptionDescription = 'Display data in which format?',
		noUserFound = 'No user to display.',
		statusOptionDescription = 'Search for users with a particular status.'
	}

	export enum editUsername {
		confirmationMessage = 'Username changed.',
		description = 'Manually modify the Minecraft username of a player.',
		newUsernameOptionDescription = 'What is the new username?',
		userOptionDescription = 'Modify the entry for which Discord UUID?',
		usernameIdenticalToPreviousOne = 'No need to change the username, the new one is identical to the one already in the database.'
	}

	export enum endSeason {
		description = `Clears the database, clears the messages from #${whitelistChannelName} and removes the ${playerRoleName} role.`,
		newSeasonBegins = 'New season!',
		saveFilename = 'season_backup.json',
		seasonEnded = 'The season has ended!',
		warning = `Warning! Are you sure you want to end the current season? The database will be cleared, roles will be reset and all messages on the #${whitelistChannelName} channel will be deleted.`
	}

	export enum reject {
		description = 'Reject the member of the Minecraft server and remove the player role on Discord.',
		silentOptionDescription = 'Send a message to the rejected user?',
		userOptionDescription = 'Member to reject'
	}

	export enum resetStatus {
		description = 'Reset the status of a member to "pending".',
		userOptionDescription = 'Member whose status needs to be reset'
	}

	export enum showInscriptionButton {
		description = 'Send a message with a button to register.',
		done = 'Done!',
		instructions = 'To register, click on the button. The bot will send you a private message to complete the registration.\n**If you entered an incorrect username during the initial setup, click on the button again.**'
	}
}

export namespace Components {
	export enum buttons {
		approve = 'Approve',
		cancel = 'Cancel',
		endSeason = 'Yes, end the season',
		doNotUpdate = 'Do not update',
		ignore = 'Ignore',
		manuallyAddedToWhitelist = 'Manual addition done',
		manuallyEditedWhitelist = 'Manual modifications done',
		no = 'No',
		register = 'Register',
		reject = 'Reject',
		yes = 'Yes'
	}

	export enum descriptions {
		approvalRequest = 'Discord account: <@${discordUuid}>.\nMinecraft Username: \`${username}\`.',
		approvalRequestNewUser = 'Discord account: <@${discordUuid}>.\nMinecraft Username: \`${username}\`.\nPerson who invited: ${inviter}.',
		usernameChangeRequest = 'Discord account: <@${discordUuid}>.\nNew Minecraft username: \`${username}\`.',
		userLeft = 'Discord account: <@${discordUuid}>.',
		userBanned = 'Discord account: <@${discordUuid}>.',
		rules = '1. Playing on the server means that you have read the rules.\n2. It is possible to build a base in the overworld outside a square of 600 blocks width around 0,0 (so, if one of the coordinates exceeds +300 or -300, you can build your base). This square is therefore reserved for shops!\n3. Make sure your constructions on the nether roof are spawn-proof.\n4. No griefing or theft is tolerated. This includes shops, houses and farms.\n5. No hack, cheat, xray, minimap or any other unfair advantage is tolerated, this includes resource packs, clients, mods and others. The only client modifications allowed are Optifine, Iris, Sodium, Phosphor and Litematica.\n6. PVP is tolerated only if all participants consent.\n7. Pranks are accepted, provided they are harmless and in good taste.\n8. Respect the territory of other players. Do not build near another\'s territory without their agreement.\n9. It is forbidden to be toxic, mean or rude to another player, on Discord or in the Minecraft server directly.\n10. The seed is private, therefore it is forbidden to try to discover it. If a player is in possession of the server seed, he is forbidden to use it to gain an advantage, this includes finding slime chunks, certain biomes, end portals, etc...\n11. If you see one or more players breaking these regulations, please notify an admin as soon as possible on Discord.\n12. If a player breaks one of these regulations, the consequences are at the discretion of the administrators.\n13. The consequences can go up to a permanent ban, just as they can be lighter.'
	}

	export enum titles {
		approvalRequest = '${discordUsername} wants to be added to the whitelist.',
		usernameChangeRequest = '${discordUsername} requests a username change.',
		userLeft = 'A user has left. Should he be removed from the server whitelist and the database?',
		userBanned = 'A user has been banned. Should he be banned from the Minecraft server in addition to the Discord server?',
		rules = 'The rules',
	}
}

export namespace Errors {
	export const missingDataOrExecute = 'The ${itemType} ${filePath} does not have the "data" or "execute" properties.';
	export const usernameUsedWithAnotherAccount = '⚠️ Another player is already registered with this Minecraft username. If this is indeed your username, contact an administrator. ⚠️';
	export const userResponseTimeout = 'Maximum response time exceeded, try again by clicking the `Register` button again.';

	export enum interaction {
		buttonExecution = 'An unknown error occurred!',
		buttonNotFound = 'No button corresponding to ${button} was found.',
		commandExecution = 'An error occurred while executing this command!',
		commandNotFound = 'No command corresponding to ${command} was found.',
		unauthorized = 'You do not have the required permissions to perform this.'
	}

	export enum discord {
		cantReadLogs = 'The bot does not have permission to read the logs.',
		noDiscordUserWithThisUuid = 'This Discord user is not a member of the server.',
		notRepliable = 'Unable to respond to this interaction.'
	}

	export enum api {
		couldNotConnectToApi = 'Error connecting to the Mojang API.',
		noMojangAccountWithThatUsername = 'No Mojang account has this username!',
		noMojangAccountWithThatUuid = 'No Mojang account has this UUID!'
	}

	export enum database {
		invalidStatus = 'Invalid status',
		notUnique = 'This Minecraft or Discord UUID already exists in the database.',
		notUniqueMinecraft = 'Another player has registered with this Minecraft account.',
		unknownError = 'An unknown error occurred while writing to the database.',
		userDoesNotExist = 'This user is not registered!'
	}

	export enum rcon {
		connexionError = 'An error occurred when connecting to the server with RCON.',
		add = connexionError + ' The addition of the player (\`${username}\`) to the whitelist must be done manually.',
		edit = connexionError + ' The modification of the whitelist must be done manually (removal of \`${oldUsername}\` and addition of \`${newUsername}\`).',
		remove = connexionError + ' The removal of the player (\`${username}\`) from the whitelist must be done manually.'
	}
}

export namespace Logs {
	export const ready = 'Ready! Connected as ${username}.';
	export const memberClickedRegisterButton = '${username} clicked on the registration button.';
	export const memberLeft = '${username} left the Discord server.';
	export const playerRoleWasRemoved = 'The role " ' + playerRoleName + ' " of ${username} is removed.';
}

export namespace Services {
	export enum html {
		style = '<style>h1,h2,h3,h4,h5,h6,p,table{font-family:arial, sans-serif;color:#d4dfe4;}p{text-align:right;}html{background-color:#141414;padding:0 40px;}table{border-collapse:collapse; width:100%;border-spacing:0;}td,th{border:1px solid #4d4d4d;padding:8px;}tr:nth-child(even){background-color:#303030;}.user{display:flex;align-items:center;height:auto;}.center{text-align:center;}img{height:50px;border-radius:5px;margin-right:10px;}.date:first-letter{text-transform: capitalize;}</style>',
		script = '<script>async function fetchUsername (minecraftUuid) { const apiUrl = \'' + sessionServer + '/minecraft/profile/\' + minecraftUuid; const response = await fetch("https://corsproxy.io/?" + apiUrl, {}); const user = await response.json(); document.getElementById(minecraftUuid).innerText = user.name;}</script>',
		template = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Members of SpiceCraft</title>'+style+'</head><body><h1>Members of SpiceCraft</h1><table><tr><th>Member</th><th>Minecraft username</th><th>Status</th><th>Registering date</th><th>Last modification</th></tr>${table}</table><p>Registered players : ${memberCount}</p></body>'+script+'</html>',
		templateWithStatus = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Members of SpiceCraft</title>'+style+'</head><body><h1>Members of SpiceCraft with « ${status} »</h1><table><tr><th>Member</th><th>Minecraft username</th><th>Registering date</th><th>Last modification</th></tr>${table}</table><p>Registered players with status "${status}" : ${memberCount}</p></body>'+script+'</html>',
		rowTemplate = '<tr><td><div class="user"><img src="${imgUrl}" alt="Profile picture of ${username}">${username}</div></td><td id="${minecraftUuid}"><button onclick="fetchUsername(\'${minecraftUuid}\')">Display</button></td><td class="center">${status}</td><td class="date">${createdAt}</td><td class="date">${updatedAt}</td></tr>',
		rowTemplateWithStatus = '<tr><td><div class="user"><img src="${imgUrl}" alt="Profile picture of ${username}">${username}</div></td><td id="${minecraftUuid}"><button onclick="fetchUsername(\'${minecraftUuid}\')">Display</button></td><td class="date">${createdAt}</td><td class="date">${updatedAt}</td></tr>'
	}

	export enum userStatus {
		cantSendDm = 'Warning: Unable to send a message to this user due to their privacy settings!',
		dmAddedToWhitelist = 'You have been added to the SpiceCraft whitelist.',
		dmRemovedFromWhitelist = 'You have been removed from the SpiceCraft whitelist. Contact the administrators for more details.',
		statusChanged = 'The status of <@${discordUuid}> has been changed to "${status}".'
	}
}

export namespace Utils {
	export const createdPlayerRole = 'The role for players did not exist, it has been created.';
}

export function getStatusName(status: number): string {
	switch (status) {
		case inscriptionStatus.awaitingApproval:
			return 'pending';
		case inscriptionStatus.approved:
			return 'approved';
		case inscriptionStatus.rejected:
			return 'rejected';
	}
}

export function statusToEmoji(status: number): string {
	switch (status) {
		case inscriptionStatus.awaitingApproval:
			return '🕓';
		case inscriptionStatus.approved:
			return '✅';
		case inscriptionStatus.rejected:
			return '❌';
	}
}