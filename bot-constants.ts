export const whitelistChannelName = 'whitelist';
export const playerRoleName = 'Joueur';
export const timeToWaitForUserInputBeforeTimeout = 240000;

export enum inscriptionStatus {
	awaitingApproval = 0,
	approved = 1,
	rejected = 2,
}

export enum errorMessages {
	invalidStatus = 'Statut invalide',
	userDoesNotExist = 'Cet utilisateur n\'est pas inscrit',
	notUnique = 'Ce UUID Minecraft ou Discord existe déjà dans la base de données.',
	unknownError = 'Une erreur inconnue est survenue lors de l\'écriture dans la base de données.'
}