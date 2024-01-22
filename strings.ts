import { inscriptionStatus, playerRoleName, whitelistChannelName } from './bot-constants';

export namespace ButtonEvents {
	export const clickToConfirmChangesToWhitelist = 'Clique sur le bouton lorsque c\'est fait, afin que <@${discordUuid}> soit informé du changement lié à sa demande.';

	export enum approbation {
		changeWhitelistBeforeCliking = 'N\'oublies pas d\'ajouter manuellement le joueur à la whitelist AVANT de cliquer sur le bouton !',
		messageSentToPlayerToConfirmInscription = 'Tu a été ajouté à la whitelist. Si tu n\'arrive pas à te connecter, ton username Minecraft est peut-être incorrect. Si c\'est le cas, clique à nouveau sur le bouton d\'inscription.',
		requestGranted = '✅ La demande a été approuvée par <@${discordUuid}>.',
		success = 'Un message a été envoyé à <@${discordUuid}> pour l\'informer de son ajout à la whitelist.',
		successNoDm = '<@${discordUuid}> a été ajouté à la whitelist. Cependant, ses paramètres de confidentialité m\'empêchent de lui envoyer un message afin de lui en informer.'
	}

	export enum ban {
		messageUpdate = '🔨 Le joueur a été retiré de la whitelist du serveur Minecraft par <@${discordUuid}>.',
		reply = '<@${discordUuid}> a été retiré du serveur Minecraft avec succès.'
	}

	export enum enrolling {
		askIfFirstTimePlaying = 'As-tu déjà joué sur SpiceCraft ?',
		messageSentInDms = 'Merci de répondre au bot qui t\'a a envoyé un message en privé !',
		messageSentInDmsNewUser = 'Bienvenue, nous sommes heureux de t\'accueillir ! Merci de répondre au bot qui t\'a envoyé un message en privé !',
		askWhatIsMinecraftUsername = 'Quel est ton nom d\'utilisateur sur Minecraft ?',
		adminsAlreadyDeniedRequest = '🚫 Les administrateurs ont déjà refusé ta demande ! 🚫',
		askWhoInvitedNewPlayer = 'Qui t\'a invité sur SpiceCraft ? Inscrit son nom d\'utilisateur Discord.',
		askWhatIsNewMinecraftUsername = 'Quel est le bon nom d\'utilisateur ?',
		reactToAcceptRules = 'Réagit avec ✅ pour indiquer que tu a lu et accepté les règles.',
		requestSucessfullyUpdated = 'Ta demande à été mise à jour avec succès !',
		waitForAdminApprobation = 'Ton inscription est en attente d\'approbation par les administrateurs, je t\'enverrais un message quand elle sera acceptée!',
		usernameUpdated = 'Ton nom d\'utilisateur a été changé avec succès, je t\'envoie un message lorsque le nom d\'utilisateur sera mis à jour dans la whitelist.',
		embedDescription = 'Compte Discord : <@${discordUuid}>.\nUsername Minecraft : \`${minecraftUsername}\`.',
		awaitingApprovalUserChangedMinecraftUsername = '<@${discordUuid}> a changé son username Minecraft pour \`${minecraftUsername}\` dans sa demande d\'ajout à la whitelist.',
		minecraftAccountDoesNotExist = '❌ Le compte Minecraft «\u00a0${minecraftUsername}\u00a0» n\'existe pas! Tu peux cliquer à nouveau le bouton \\`S\'inscrire\\` pour réessayer. ❌',
		dmsAreClosed = 'Tes paramètres de confidentialité m\'empêchent de t\'envoyer des messages. Change ces paramètres pour continuer.',
		sameMinecraftAccountAsBefore = 'Pas besoin de mettre à jour ton nom d\'utilisateur, car il est identique à celui associé au compte Minecraft dans la whitelist.'
	}

	export enum rejection {
		messageSentToUserToInformRejection = 'Désolé, mais les administrateurs ont choisi de ne pas t\'ajouter à la whitelist. Contacte-les pour plus de détails.',
		requestDenied = '❌ La demande a été rejetée par <@${discordUuid}>.',
		askConfirmation = 'Es-tu certain de vouloir rejeter <@${discordUuid}> ?',
		success = 'Un message a été envoyé à <@${discordUuid}> pour l\'informer du rejet.',
		successNoDm = '<@${discordUuid}> a été rejeté. Cependant, ses paramètres de confidentialité m\'empêchent de lui envoyer un message afin de lui en informer.',
		userStillInBdExplanation = 'Cet utilisateur est encore dans la base de données, avec le statut «\u00a0rejeté\u00a0», donc s\'il rejoint à nouveau le serveur, le bot se souvient que <@${discordUuid}> est rejeté. Si tu souhaite le supprimer, tu peux utiliser la commande /supprimer-entree'
	}

	export enum usernameChangeConfirmation {
		messageUpdate = '✅ La mise à jour de username a été complétée (avec l\'autorisation de <@${discordUuid}>).',
		messageSentToConfirmUsernameChange = 'Ton username Minecraft a été mis à jour dans la whitelist.',
		success = 'Un message a été envoyé à <@${discordUuid}> pour l\'informer de la mise à jour du username.',
		successNoDm = 'Mise a jour du compte Minecraft de <@${discordUuid}> effectuée avec succès, dans la whitelist et la base de données. Cependant, ses paramètres de confidentialité m\'empêchent de lui envoyer un message afin de lui en informer.',
		changeWhitelistBeforeCliking = 'N\'oublies pas de modifier manuellement la whitelist AVANT de cliquer sur le bouton !'
	}
}

export namespace Commands {
	export enum addMember {
		alreadyInDatabase = 'Cet utilisateur existe déjà dans la base de données. Si tu veux modifier le compte Minecraft qui lui est associé, utilise la commande `/modifier-username`.',
		dmApproved = 'Un administrateur t\'a manuellement ajouté à la whitelist du serveur.',
		dmRejected = 'Un administrateur t\'a manuellement rejeté de la whitelist du serveur.',
		membreOptionDescription = 'Membre à inscrire.',
		silentOptionDescription = 'Envoyer un message à l\'utilisateur\u00a0?',
		success = 'Le profil de <@${discordUuid}> est désormais dans la base de donnée !',
		successNoDm = 'Le profil de <@${discordUuid}> est désormais dans la base de donnée ! Toutefois, il a été impossible de lui envoyer un message en raison de ses paramètres de confidentialité.',
		statusOptionDescription = 'Status à attribuer au membre. Si aucun n\'est spécifié, il sera approuvé.',
		usernameMinecraftOptionDescription = 'Nom de l\'utilisateur sur Minecraft du joueur.'
	}

	export enum approve {
		description = 'Approuver le membre du serveur Minecraft et lui ajouter le rôle joueur sur le Discord.',
		memberOptionDescription = 'Membre à approuver',
		silentOptionDescription = 'Envoyer un message à l\'utilisateur approuvé ?'
	}

	export enum deleteEntry {
		messageUpdate = '🗑️ L\'utilisateur a été supprimé de la whitelist et de la base de données.',
		reply = '<@${discordUuid}> à été supprimé de la whitelist et de la base de données avec succès.',
		description = 'Supprime une rangée dans la base de données.',
		userIdOption = 'Retirer l\'entrée pour quel UUID Discord ?'
	}

	export enum displayUsername {
		description = 'Affiche le nom d\'utilisateur Minecraft d\'un membre.',
		userOptionDescription = 'Membre dont il faut afficher le nom d\'utilisateur Minecraft.'
	}

	export enum displayUsers {
		noUserFound = 'Aucun utilisateur à afficher.',
		displayingUsersWithStatus = 'Affichage des utilisateurs avec le statut «\u00a0${status}\u00a0»',
		displayingAllUsers = 'Affichage de tous les utilisateurs',
		databaseEntryLine = '<@${discordUuid}> | [Afficher](<https://api.mojang.com/user/profile/${minecraftUuid}>) | ${statusEmoji}\n',
		filenameJson = 'utilisateurs.json',
		filenameJsonWithStatus = 'utilisateurs_${status}.json',
		filenameHtml = 'utilisateurs.html',
		description = 'Affiche les utilisateurs inscrit selon leur statut (optionnel).',
		statusOptionDescription = 'Rechercher les utilisateur avec un statut particulier.',
		formatOptionDescription = 'Afficher les données avec quel format?'
	}

	export enum editUsername {
		usernameIdenticalToPreviousOne = 'Pas besoin de changer le nom d\'utilisateur, le nouveau est identique à celui déjà dans la base de données.',
		confirmationMessage = 'Nom d\'utilisateur changé.',
		description = 'Manuellement modifier le nom d\'utilisateur Minecraft d\'un joueur.',
		userOptionDescription = 'Modifier l\'entrée pour quel UUID Discord\u00a0?',
		newUsernameOptionDescription = 'Quel est le nouveau nom d\'utilisateur\u00a0?'
	}

	export enum endSeason {
		warning = `Attention ! Es-tu certain de vouloir terminer la saison en cours? La base de donnée sera effacée, les rôles seront remis à zéro et tous les messages sur le channel #${whitelistChannelName} seront effacés.`,
		description = `Efface la base de données, efface les messages de #${whitelistChannelName} et supprime le rôle ${playerRoleName}.`,
		seasonEnded = 'La saison a pris fin !',
		newSeasonBegins = 'Nouvelle saison !'
	}

	export enum reject {
		description = 'Rejeter le membre du serveur Minecraft et lui retirer le rôle joueur sur le Discord.',
		userOptionDescription = 'Membre à rejeter',
		silentOptionDescription = 'Envoyer un message à l\'utilisateur rejeté\u00a0?'
	}

	export enum resetStatus {
		description = 'Remettre le statut d\'un membre à «\u00a0en attente\u00a0».',
		userOptionDescription = 'Membre dont il faut réinitialiser le statut'
	}

	export enum showInscriptionButton {
		description = 'Envoie un message avec un bouton permettant de s\'inscrire.',
		instructions = 'Pour t\'inscrire, clique sur le bouton. Le bot va t\'envoyer un message privé pour compléter l\'inscription.\n**Si tu as entré un nom d\'utilisateur erroné lors de la configuration initiale, clique sur le bouton à nouveau.**',
		done = 'Fait\u00a0!'
	}
}

export namespace Components {
	export enum buttons {
		cancel = 'Annuler',
		approve = 'Approuver',
		reject = 'Rejeter',
		yes = 'Oui',
		no = 'Non',
		ignore = 'Ignorer',
		endSeason = 'Oui, terminer la saison',
		register = 'S\'inscrire',
		doNotUpdate = 'Ne pas mettre à jour',
		manuallyAddedToWhitelist = 'Ajout manuel effectué',
		manuallyEditedWhitelist = 'Modifications manuelles effectuées'
	}

	export enum descriptions {
		approvalRequest = 'Compte Discord : <@${discordUuid}>.\nUsername Minecraft : \`${username}\`.',
		approvalRequestNewUser = 'Compte Discord : <@${discordUuid}>.\nUsername Minecraft : \`${username}\`.\nPersonne qui a invité : ${inviter}.',
		usernameChangeRequest = 'Compte Discord : <@${discordUuid}>.\nNouveau username Minecraft : \`${username}\`.',
		userLeft = 'Compte Discord : <@${discordUuid}>.',
		userBanned = 'Compte Discord : <@${discordUuid}>.',
		rules = '1. Jouer sur le serveur signifie que vous avez pris connaissance des règles.\n2. Il est possible de construire une base dans l\'overworld à l\'extérieur d\'un carré de 600 blocs de largeur autour de 0,0 (donc, si une des coordonnées excède +300 ou -300, vous pouvez construire votre base). Ce carré est donc réservé pour les boutiques!\n3. Assurez vous que vos constructions sur le toit du nether soient spawn-proof.\n4. Aucun grief ou vol n\'est toléré. Cela inclut boutiques, maisons et farms.\n5. Aucun hack, cheat, xray, minimap ou tout autre avantage injuste n\'est toléré, ceci inclut les ressource packs, clients, mods et autres. Les seules modifications du client autorisées sont Optifine, Iris, Sodium, Phosphore et Litematica.\n6. Le PVP est toléré uniquement si tous les participants y consentent.\n7. Les pranks sont acceptés, à condition d\'être inoffensifs et de bon goût.\n8. Respectez le territoire des autres joueurs. Ne construisez pas proche du territoire d\'un autre sans son accord.\n9. Il est interdit d\'être toxique, méchant ou rude avec un autre joueur, sur Discord ou dans le serveur Minecraft directement.\n10. La seed est privée, par conséquent il est interdit d\'essayer de la découvrir. Si un joueur est en possession de la seed du serveur, il lui est interdit de l\'utiliser pour obtenir un avantage, cela inclut trouver les slime chunks, certains biomes, des portails de l\'end, etc...\n11. Si vous voyez un ou des joueurs enfreindre ces règlements, veuillez aviser un admin le plus rapiement possible sur Discord.\n12. Si un joueur enfreint un de ces règlements, les conséquences sont à la discrétion des administrateurs.\n13. Les conséquences peuvent aller jusqu\'à un bannissement permanent, tout comme elles peuvent être plus légères.'
	}

	export enum titles {
		approvalRequest = '${discordUsername} veut être ajouté à la whitelist.',
		usernameChangeRequest = '${discordUsername} demande un changement de nom d\'utilisateur.',
		userLeft = 'Un utilisateur a quitté. Faut-il le retirer de la whitelist du serveur et de la base de données ?',
		userBanned = 'Un utilisateur a été banni. Faut-il le bannir du serveur Minecraft en plus du sereur Discord ?',
		rules = 'Les règles',
	}
}

export namespace Errors {
	export const usernameUsedWithAnotherAccount = '⚠️\u00a0Un autre joueur est déjà inscrit avec ce nom d\'utilisateur Minecraft. S\'il s\'agit bien de ton nom d\'utilisateur, contacte un administrateur.\u00a0⚠️';
	export const userResponseTimeout = 'Temps de réponse maximum dépassé, réessaye en cliqant le bouton `S\'inscrire` à nouveau.';
	export const missingDataOrExecute = 'Le ${itemType} ${filePath} n\'a pas les propriétés «\u00a0data\u00a0» ou «\u00a0execute\u00a0».';

	export enum interaction {
		commandExecution = 'Une erreur s\'est produite lors de l\'exécution de cette commande !',
		commandNotFound = 'Aucune commande ne corresponsant à ${command} n\'a été trouvée.',
		buttonExecution = 'Une erreur inconnue s\'est produite !',
		buttonNotFound = 'Aucun bouton ne corresponsant à ${button} n\'a été trouvée.',
		unauthorized = 'Tu n\'as pas les permissions requises pour effectuer ceci.'
	}

	export enum discord {
		noDiscordUserWithThisUuid = 'Cet utilisateur Discord n\'est pas membre du serveur.',
		notRepliable = 'Impossible de répondre à cette interaction.',
		cantReadLogs = 'Le bot n\'a pas la permission de lire les logs.'
	}

	export enum api {
		couldNotConnectToApi = 'Erreur lors de la connexion à l\'API de Mojang.',
		noMojangAccountWithThatUsername = 'Aucun compte Mojang n\'a ce nom d\'utilisateur !',
		noMojangAccountWithThatUuid = 'Aucun compte Mojang n\'a ce UUID !'
	}

	export enum database {
		userDoesNotExist = 'Cet utilisateur n\'est pas inscrit.',
		notUnique = 'Ce UUID Minecraft ou Discord existe déjà dans la base de données.',
		notUniqueMinecraft = 'Un autre joueur s\'est inscrit avec ce compte Minecraft.',
		unknownError = 'Une erreur inconnue est survenue lors de l\'écriture dans la base de données.',
		invalidStatus = 'Statut invalide'
	}

	export enum rcon {
		connexionError = 'Une erreur est survenue lors de la connexion au serveur avec RCON.',
		add = connexionError + ' L\'ajout du joueur (\`${username}\`) à la whitelist doit être effectué manuellement.',
		edit = connexionError + ' La modification de la whitelist doit être effectuée manuellement (retrait de \`${oldUsername}\` et ajout de \`${newUsername}\`).',
		remove = connexionError + ' Le retrait du joueur (\`${username}\`) dans la whitelist doit être effectué manuellement.'
	}
}

export namespace Logs {
	export const ready = 'Prêt ! Connecté en tant que ${username}.';
}

export namespace Services {
	export enum html {
		template = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Utilisateurs</title><style>h1, h2, h3, h4, h5, h6, p, table { font-family: arial, sans-serif;color: #d4dfe4;} html {background-color: #141414;padding: 0 40px;}table { border-collapse: collapse; width: 100%;border-spacing:0;}td,th{border:1px solid #4d4d4d;padding:8px;}tr:nth-child(even){background-color: #303030;}.user{display: flex; align-items: center; height:auto;}td:nth-child(3){text-align:center;}img{height: 50px;border-radius: 5px;margin-right: 10px;}.date:first-letter {text-transform: capitalize;}</style></head><body><h1>Utilisateurs de SpiceCraft</h1><table><tr><th>Utilisateur</th><th>Nom d\'utilisateur Minecraft</th><th>Statut</th><th>Date d\'inscription</th><th>Dernière modification</th></tr>${tableRows}</table></body><script>async function fetchUsername (minecraftUuid) { const apiUrl = \'https://api.mojang.com/user/profile/\' + minecraftUuid; const response = await fetch("https://corsproxy.io/?" + apiUrl, {}); const user = await response.json(); document.getElementById(minecraftUuid).innerHTML = user.name;}</script></html>',
		rowTemplate = '<tr><td><div class="user"><img src="${imgUrl}" alt="Photo de profil de ${username}">${username}</div></td><td id="${minecraftUuid}"><button onclick="fetchUsername(\'${minecraftUuid}\')">Afficher</button></td><td>${status}</td><td class="date">${createdAt}</td><td class="date">${updatedAt}</td></tr>'
	}

	export enum userStatus {
		dmAddedToWhitelist = 'Tu a été ajouté à la whitelist de SpiceCraft.',
		dmRemovedFromWhitelist = 'Tu a été retiré de la whitelist de SpiceCraft. Contacte les administrateurs pour plus de détails.',
		cantSendDm = 'Attention : Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité\u00a0!',
		statusChanged = 'Le statut de <@${discordUuid}> à été changé pour «\u00a0${status}\u00a0».'
	}
}

export namespace Utils {
	export const createdPlayerRole = 'Le rôle pour les joueurs n\'existait pas, il a été créé.';
}

export function getStatusName(status: number): string {
	switch (status) {
		case inscriptionStatus.awaitingApproval:
			return 'en attente';
		case inscriptionStatus.approved:
			return 'approuvé';
		case inscriptionStatus.rejected:
			return 'rejeté';
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