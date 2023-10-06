import * as Constants from './bot-constants'

export enum register {
	timeoutAnswer = 'Temps de réponse maximum dépassé, veuillez réessayer en cliqant le bouton `S\'inscrire` à nouveau.',
	messageSentInDms = 'Merci de répondre au bot qui vous a envoyé un message en privé !',
	adminsAlreadyDeniedRequest = '🚫 Les administrateurs ont déjà refusé ta demande ! 🚫',
	askWhatIsMinecraftUsername = 'Quel est ton nom d\'utilisateur sur Minecraft ?',
	askWhatIsNewMinecraftUsername = 'Quel est le bon nom d\'utilisateur ?',
	rulesEmbedTitle = 'Les règles',
	rules = '1. Jouer sur le serveur signifie que vous avez pris connaissance des règles.\n2. Il est possible de construire une base dans l\'overworld à l\'extérieur d\'un carré de 600 blocs de largeur autour de 0,0 (donc, si une des coordonnées excède +300 ou -300, vous pouvez construire votre base). Ce carré est donc réservé pour les boutiques!\n3. Assurez vous que vos constructions sur le toit du nether soient spawn-proof.\n4. Aucun grief ou vol n\'est toléré. Cela inclut boutiques, maisons et farms.\n5. Aucun hack, cheat, xray, minimap ou tout autre avantage injuste n\'est toléré, ceci inclut les ressource packs, clients, mods et autres. Les seules modifications du client autorisées sont Optifine, Iris, Sodium, Phosphore et Litematica.\n6. Le PVP est toléré uniquement si tous les participants y consentent.\n7. Les pranks sont acceptés, à condition d\'être inoffensifs et de bon goût.\n8. Respectez le territoire des autres joueurs. Ne construisez pas proche du territoire d\'un autre sans son accord.\n9. Il est interdit d\'être toxique, méchant ou rude avec un autre joueur, sur Discord ou dans le serveur Minecraft directement.\n10. La seed est privée, par conséquent il est interdit d\'essayer de la découvrir. Si un joueur est en possession de la seed du serveur, il lui est interdit de l\'utiliser pour obtenir un avantage, cela inclut trouver les slime chunks, certains biomes, des portails de l\'end, etc...\n11. Si vous voyez un ou des joueurs enfreindre ces règlements, veuillez aviser un admin le plus rapiement possible sur Discord.\n12. Si un joueur enfreint un de ces règlements, les conséquences sont à la discrétion des administrateurs.\n13. Les conséquences peuvent aller jusqu\'à un bannissement permanent, tout comme elles peuvent être plus légères.',
	reactToAcceptRules = 'Réagit avec ✅ pour indiquer que tu a lu et accepté les règles.',
	usernameUsedWithAnotherAccount = '⚠️ Un autre joueur est déjà inscrit avec ce nom d\'utilisateur Minecraft. S\'il s\'agit bien de ton nom d\'utilisateur, contacte un administrateur. ⚠️',
	errorWhileConnectingToMojangServer = '❌ Une erreur s\'est produite lorsque nous avons tenté de se connecter aux serveurs de Mojang afin d\'obtenir plus d\'informations sur ton compte. Si le problème persiste, contacte les administrateurs. ❌',
	requestSucessfullyUpdated = 'Ta demande à été mise à jour avec succès !',
	waitForAdminApprobation = 'Ton inscription est en attente d\'approbation par les administrateurs, je t\'enverrais un message quand elle sera acceptée!',
	usernameUpdated = 'Votre nom d\'utilisateur a été changé avec succès, je t\'envoie un message lorsque le nom d\'utilisateur sera mis à jour dans la whitelist.',
	embedDescription = 'Compte Discord : <@$discordUuid$>.\nUsername Minecraft : $minecraftUsername$.',
	unaprovedUserChangedMinecraftUsername = '<@$discordUuid$> a changé son username Minecraft pour \`$minecraftUsername$\` dans sa demande d\'ajout à la whitelist.',
	minecraftAccountDoesNotExist = '❌ Le compte Minecraft « $minecraftUsername$ » n\'existe pas! Tu peux cliquer à nouveau le bouton \`S\'inscrire\` pour réessayer. ❌',
	dmsAreClosed = 'Tes paramètres de confidentialité m\'empêchent de t\'envoyer des messages. Change ces paramètres pour pouvoir compléter ton inscription.',
	unknownError = 'Une erreur inconnue est survenue !',
	sameMinecraftAccountAsBefore = 'Pas besoin de mettre à jour ton nom d\'utilisateur, car il est identique à celui associé au compte Minecraft dans la whitelist.'
}
export enum editUserStatus {
	dmAddedToWhitelist = 'Tu a été ajouté à la whitelist de SpiceCraft.',
	dmRemovedFromWhitelist = 'Tu a été retiré de la whitelist de SpiceCraft. Contacte les administrateurs pour plus de détails.',
	cantSendDm = 'Attention : Impossible d\'envoyer un message à cet utilisateur en raison de ses paramètres de confidentialité !',
	statusChanged = 'Le statut de <@$discordUuid$> à été changé pour "$status$".'
}

export enum requestAdminApproval {
	approvalRequestTitle = '$discordUsername$ veut être ajouté à la whitelist.',
	usernameChangeRequestTitle = '$discordUsername$ demande un changement de nom d\'utilisateur.',
	approvalRequestDescription = 'Compte Discord : <@$discordUuid$>.\nUsername Minecraft : $username$.',
	userNameChangeRequestDescription = 'Compte Discord : <@$discordUuid$>.\nNouveau username Minecraft : $username$.'
}

export enum displayUsers {
	noUserFound = 'Aucun utilisateur à afficher.',
	displayingUsersWithStatus = 'Affichage des utilisateurs avec le statut "$status$"',
	displayingAllUsers = 'Affichage de tous les utilisateurs',
	databaseEntryLine = '<@$discordUuid$> | [Afficher](<https://api.mojang.com/user/profile/$minecraftUuid$>) | $statusEmoji$\n',
	filename = 'utilisateurs.json',
	fileNameWithStatus = 'utilisateurs_$status$.json'
}

export enum deleteEntry {
	reply = 'L\'utilisateur à été supprimé de la base de données.'
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