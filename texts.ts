import * as Constants from './bot-constants';

export enum register {
	timeoutAnswer = 'Temps de réponse maximum dépassé, veuillez réessayer en cliqant le bouton `S\'inscrire` à nouveau.',
	messageSentInDms = 'Merci de répondre au bot qui vous a envoyé un message en privé !',
	adminsAlreadyDeniedRequest = '🚫 Les administrateurs ont déjà refusé ta demande ! 🚫',
	askWhatIsMinecraftUsername = 'Quel est ton nom d\'utilisateur sur Minecraft ?',
	askWhatIsNewMinecraftUsername = 'Quel est le bon nom d\'utilisateur ?',
	reactToAcceptRules = 'Réagit avec ✅ pour indiquer que tu a lu et accepté les règles.',
	errorWhileConnectingToMojangServer = '❌ Une erreur s\'est produite lorsque nous avons tenté de se connecter aux serveurs de Mojang afin d\'obtenir plus d\'informations sur ton compte. Si le problème persiste, contacte les administrateurs. ❌',
	requestSucessfullyUpdated = 'Ta demande à été mise à jour avec succès !',
	waitForAdminApprobation = 'Ton inscription est en attente d\'approbation par les administrateurs, je t\'enverrais un message quand elle sera acceptée!',
	usernameUpdated = 'Ton nom d\'utilisateur a été changé avec succès, je t\'envoie un message lorsque le nom d\'utilisateur sera mis à jour dans la whitelist.',
	embedDescription = 'Compte Discord : <@$discordUuid$>.\nUsername Minecraft : $minecraftUsername$.',
	awaitingApprovalUserChangedMinecraftUsername = '<@$discordUuid$> a changé son username Minecraft pour \`$minecraftUsername$\` dans sa demande d\'ajout à la whitelist.',
	minecraftAccountDoesNotExist = '❌ Le compte Minecraft « $minecraftUsername$ » n\'existe pas! Tu peux cliquer à nouveau le bouton \`S\'inscrire\` pour réessayer. ❌',
	dmsAreClosed = 'Tes paramètres de confidentialité m\'empêchent de t\'envoyer des messages. Change ces paramètres pour pouvoir compléter ton inscription.',
	sameMinecraftAccountAsBefore = 'Pas besoin de mettre à jour ton nom d\'utilisateur, car il est identique à celui associé au compte Minecraft dans la whitelist.'
}

export enum editUserStatus {
	dmAddedToWhitelist = 'Tu a été ajouté à la whitelist de SpiceCraft.',
	dmRemovedFromWhitelist = 'Tu a été retiré de la whitelist de SpiceCraft. Contacte les administrateurs pour plus de détails.',
	cantSendDm = 'Attention : Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité !',
	statusChanged = 'Le statut de <@$discordUuid$> à été changé pour "$status$".'
}

export namespace events {
	enum approbationButton {
		messageSentToPlayerToConfirmInscription = 'Tu a été ajouté à la whitelist. Si tu n\'arrive pas à te connecter, ton username Minecraft est peut-être incorrect. Si c\'est le cas, clique à nouveau sur le bouton d\'inscription.',
		requestGranted = '✅ La demande a été approuvée.',
		successReply = 'Un message a été envoyé à <@$discordUuid$> pour l\'informer de son ajout à la whitelist.'
	}

	enum rejectionButton {
		messageSentToUserToInformRejection = 'Désolé, mais les administrateurs ont choisi de ne pas t\'ajouter à la whitelist. Contacte-les pour plus de détails.',
		requestDenied = '❌ La demande a été rejetée.',
		askConfirmation = 'Êtes vous certain de vouloir rejeter <@$discordUuid$> ?',
		informedUserAboutRejection = 'Un message a été envoyé à <@$discordUuid$> pour l\'informer du rejet.'
	}

	enum usernameChangeConfirmationButton {
		messageUpdate = '✅ La mise à jour de username a été complétée.',
		messageSentToConfirmUsernameChange = 'Ton username Minecraft a été mis à jour dans la whitelist.',
		informedUserAboutUpdate = 'Un message a été envoyé à <@$discordUuid$> pour l\'informer de la mise à jour du username.'
	}

	export import approbation = approbationButton;
	export import rejection = rejectionButton;
	export import usernameChangeConfirmation = usernameChangeConfirmationButton;
}

export namespace commands {
	enum showInscriptionButtonCommand {
		description = 'Envoie un message avec un bouton permettant de s\'inscrire.',
		instructions = 'Pour vous inscrire veuillez cliquer sur le bouton. Le bot va vous envoyer un message privé pour compléter votre inscription.\n**Si vous avez entré un nom d\'utilisateur erroné lors de la configuration initiale, cliquez sur le bouton à nouveau.**',
		done = 'Fait !'
	}

	enum resetStatusCommand {
		description = 'Remettre le statut d\'un membre à "en attente".',
		userOptionDescription = 'Membre dont il faut réinitialiser le statut'
	}

	enum deleteEntryCommand {
		messageUpdate = '🗑️ L\'utilisateur a été supprimé de la base de données.',
		reply = 'L\'utilisateur à été supprimé de la base de données avec succès.',
		description = 'Supprime une rangée dans la base de données.',
		userIdOption = 'Retirer l\'entrée pour quel UUID Discord ?'
	}

	enum displayUsersCommand {
		noUserFound = 'Aucun utilisateur à afficher.',
		displayingUsersWithStatus = 'Affichage des utilisateurs avec le statut "$status$"',
		displayingAllUsers = 'Affichage de tous les utilisateurs',
		databaseEntryLine = '<@$discordUuid$> | [Afficher](<https://api.mojang.com/user/profile/$minecraftUuid$>) | $statusEmoji$\n',
		filename = 'utilisateurs.json',
		fileNameWithStatus = 'utilisateurs_$status$.json',
		description = 'Affiche les utilisateurs inscrit selon leur statut (optionnel).',
		statusOptionDescription = 'Rechercher les utilisateur avec un statut particulier.',
		formatOptionDescription = 'Afficher les données avec quel format?'
	}

	enum approveCommand {
		description = 'Approuver le membre du serveur Minecraft et lui ajouter le rôle joueur sur le Discord.',
		memberOptionDescription = 'Membre à approuver',
		silentOptionDescription = 'Envoyer un message à l\'utilisateur approuvé ?'
	}

	enum rejectCommand {
		description = 'Rejeter le membre du serveur Minecraft et lui retirer le rôle joueur sur le Discord.',
		userOptionDescription = 'Membre à rejeter',
		silentOptionDescription = 'Envoyer un message à l\'utilisateur rejeté ?'
	}

	enum editUsernameCommand {
		usernameIdenticalToPreviousOne = 'Pas besoin de changer le nom d\'utilisateur, le nouveau est identique à celui déjà dans la base de données.',
		confirmationMessage = 'Nom d\'utilisateur changé.',
		description = 'Manuellement modifier le nom d\'utilisateur Minecraft d\'un joueur.',
		userOptionDescription = 'Modifier l\'entrée pour quel UUID Discord ?',
		newUsernameOptionDescription = 'Quel est le nouveau nom d\'utilisateur ?'
	}
	enum endSeasonCommand {
		warning = `Attention ! Êtes vous certain de vouloir terminer la saison en cours? La base de donnée sera effacée, les rôles seront remis à zéro et tous les messages sur le channel #${Constants.whitelistChannelName} seront effacés.`,
		description = `Efface la base de données, efface les messages de #${Constants.whitelistChannelName} et supprime le rôle ${Constants.playerRoleName}.`,
		seasonEnded = 'La saison a pris fin !',
		newSeasonBegins = 'Nouvelle saison !'
	}

	export import showInscriptionButton = showInscriptionButtonCommand;
	export import resetStatus = resetStatusCommand;
	export import deleteEntry = deleteEntryCommand;
	export import displayUsers = displayUsersCommand;
	export import approve = approveCommand;
	export import reject = rejectCommand;
	export import editUsername = editUsernameCommand;
	export import endSeason = endSeasonCommand;
}

export namespace errors {
	export const cantSendMessageToUser = 'Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité.';
	export const usernameUsedWithAnotherAccount = '⚠️ Un autre joueur est déjà inscrit avec ce nom d\'utilisateur Minecraft. S\'il s\'agit bien de ton nom d\'utilisateur, contacte un administrateur. ⚠️';
	export const noDiscordUserWithThisUuid = 'Cet utilisateur Discord n\'est pas membre du serveur.';
	export const generic = 'Une erreur est inconnue survenue !';

	enum apiErrors {
		couldNotConnectToApi = 'Erreur lors de la connexion à l\'API de Mojang.',
		noMojangAccountWithThatUsername = 'Aucun compte Mojang n\'a ce nom d\'utilisateur !'
	}

	enum databaseErrors {
		userDoesNotExist = 'Cet utilisateur n\'est pas inscrit',
		notUnique = 'Ce UUID Minecraft ou Discord existe déjà dans la base de données.',
		unknownError = 'Une erreur inconnue est survenue lors de l\'écriture dans la base de données.',
		invalidStatus = 'Statut invalide'
	}

	export import database = databaseErrors;
	export import api = apiErrors;
}

export namespace embeds {
	enum embedComponents {
		cancel = 'Annuler',
		approve = 'Approuver',
		reject = 'Rejeter',
		yes = 'Oui',
		ignore = 'Ignorer',
		endSeason = 'Oui, terminer la saison',
		register = 'S\'inscrire'
	}

	enum embedTitles {
		approvalRequest = '$discordUsername$ veut être ajouté à la whitelist.',
		usernameChangeRequest = '$discordUsername$ demande un changement de nom d\'utilisateur.',
		userLeft = 'Un utilisateur a quitté. Faut-il le retirer de la base de données ?',
		rules = 'Les règles',
	}

	enum embedDescription {
		approvalRequest = 'Compte Discord : <@$discordUuid$>.\nUsername Minecraft : $username$.',
		usernameChangeRequest = 'Compte Discord : <@$discordUuid$>.\nNouveau username Minecraft : $username$.',
		userLeft = 'Compte Discord : <@$discordUuid$>.',
		rules = '1. Jouer sur le serveur signifie que vous avez pris connaissance des règles.\n2. Il est possible de construire une base dans l\'overworld à l\'extérieur d\'un carré de 600 blocs de largeur autour de 0,0 (donc, si une des coordonnées excède +300 ou -300, vous pouvez construire votre base). Ce carré est donc réservé pour les boutiques!\n3. Assurez vous que vos constructions sur le toit du nether soient spawn-proof.\n4. Aucun grief ou vol n\'est toléré. Cela inclut boutiques, maisons et farms.\n5. Aucun hack, cheat, xray, minimap ou tout autre avantage injuste n\'est toléré, ceci inclut les ressource packs, clients, mods et autres. Les seules modifications du client autorisées sont Optifine, Iris, Sodium, Phosphore et Litematica.\n6. Le PVP est toléré uniquement si tous les participants y consentent.\n7. Les pranks sont acceptés, à condition d\'être inoffensifs et de bon goût.\n8. Respectez le territoire des autres joueurs. Ne construisez pas proche du territoire d\'un autre sans son accord.\n9. Il est interdit d\'être toxique, méchant ou rude avec un autre joueur, sur Discord ou dans le serveur Minecraft directement.\n10. La seed est privée, par conséquent il est interdit d\'essayer de la découvrir. Si un joueur est en possession de la seed du serveur, il lui est interdit de l\'utiliser pour obtenir un avantage, cela inclut trouver les slime chunks, certains biomes, des portails de l\'end, etc...\n11. Si vous voyez un ou des joueurs enfreindre ces règlements, veuillez aviser un admin le plus rapiement possible sur Discord.\n12. Si un joueur enfreint un de ces règlements, les conséquences sont à la discrétion des administrateurs.\n13. Les conséquences peuvent aller jusqu\'à un bannissement permanent, tout comme elles peuvent être plus légères.'
	}

	export import components = embedComponents;
	export import titles = embedTitles;
	export import descriptions = embedDescription;
}

export function getStatusName(status: number): string {
	switch (status) {
		case Constants.inscriptionStatus.awaitingApproval: return 'en attente';
		case Constants.inscriptionStatus.approved: return 'approuvé';
		case Constants.inscriptionStatus.rejected: return 'rejeté';
	}
}

export function statusToEmoji(status: number): string {
	switch (status) {
		case Constants.inscriptionStatus.awaitingApproval: return '🕓';
		case Constants.inscriptionStatus.approved: return '✅';
		case Constants.inscriptionStatus.rejected: return '❌';
	}
}