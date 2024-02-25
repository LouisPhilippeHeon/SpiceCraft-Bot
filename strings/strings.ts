import { lang } from '../bot-constants';
import { error } from '../services/logger';

export const strings = getStrings();

export const ButtonEvents = strings.ButtonEvents;
export const Commands = strings.Commands;
export const Components = strings.Components;
export const Errors = strings.Errors;
export const Logs = strings.Logs;
export const Services = strings.Services;
export const Utils = strings.Utils;

export function getStrings(): StringsType {
	try {
		return require(`./${lang}.ts`);
	}
	catch (e) {
		error(e);
	}
}

interface StringsType {
	ButtonEvents: ButtonEventsType;
	Commands: CommandsType;
	Components: ComponentsType;
	Errors: ErrorsType;
	Logs: LogsType;
	Services: ServicesType;
	Utils: UtilsType;
	getStatusName(status: number): string;
	statusToEmoji(status: number): string;
}

export interface ButtonEventsType {
	clickToConfirmChangesToWhitelist: string;
	approbation: {
		changeWhitelistBeforeCliking: string;
		messageSentToPlayerToConfirmInscription: string;
		requestGranted: string;
		success: string;
		successNoDm: string;
	};
	ban: {
		messageUpdate: string;
		reply: string;
	};
	enrolling: {
		adminsAlreadyDeniedRequest: string;
		askIfFirstTimePlaying: string;
		askWhatIsMinecraftUsername: string;
		askWhatIsNewMinecraftUsername: string;
		askWhoInvitedNewPlayer: string;
		awaitingApprovalUserChangedMinecraftUsername: string;
		dmsAreClosed: string;
		embedDescription: string;
		messageSentInDms: string;
		messageSentInDmsNewUser: string;
		minecraftAccountDoesNotExist: string;
		reactToAcceptRules: string;
		requestSucessfullyUpdated: string;
		sameMinecraftAccountAsBefore: string;
		usernameUpdated: string;
		waitForAdminApprobation: string;
	};
	rejection: {
		messageSentToUserToInformRejection: string;
		requestDenied: string;
		askConfirmation: string;
		success: string;
		successNoDm: string;
		userStillInBdExplanation: string;
	};
	usernameChangeConfirmation: {
		changeWhitelistBeforeCliking: string;
		messageUpdate: string;
		messageSentToConfirmUsernameChange: string;
		success: string;
		successNoDm: string;
	};
}

export interface CommandsType {
	addMember: {
		alreadyInDatabase: string;
		dmApproved: string;
		dmRejected: string;
		memberOptionDescription: string;
		silentOptionDescription: string;
		success: string;
		successNoDm: string;
		statusOptionDescription : string;
		usernameMinecraftOptionDescription : string;
	};
	approve: {
		description: string;
		memberOptionDescription: string;
		silentOptionDescription: string;
	};
	deleteEntry: {
		description: string,
		messageUpdate: string;
		removeFromWhitelistOption: string;
		reply: string;
		userIdOption : string;
	};
	findDiscordMember: {
		description: string;
		usernameOptionDescription: string;
	};
	findMinecraftMember: {
		description: string;
		userOptionDescription: string;
	};
	displayUsers: {
		databaseEntryLine: string;
		description: string;
		displayingAllUsers: string;
		displayingUsersWithStatus: string;
		filenameHtml: string;
		filenameJson: string;
		filenameJsonWithStatus: string;
		filenameHtmlWithStatus: string;
		formatOptionDescription: string;
		noUserFound: string;
		statusOptionDescription: string;
	};
	editUsername: {
		confirmationMessage: string;
		description: string;
		newUsernameOptionDescription: string;
		userOptionDescription: string;
		usernameIdenticalToPreviousOne: string;
	};
	endSeason: {
		description: string;
		newSeasonBegins: string;
		saveFilename: string;
		seasonEnded: string;
		warning: string;
	};
	reject: {
		description: string;
		silentOptionDescription: string;
		userOptionDescription: string;
	};
	resetStatus: {
		description: string;
		userOptionDescription: string;
	};
	showInscriptionButton: {
		description: string;
		done: string;
		instructions: string;
	};
}

export interface ComponentsType {
	buttons: {
		approve: string;
		cancel: string;
		endSeason: string;
		doNotUpdate: string;
		ignore: string;
		manuallyAddedToWhitelist: string;
		manuallyEditedWhitelist: string;
		no: string;
		register: string;
		reject: string;
		yes: string;
	};
	descriptions: {
		approvalRequest: string;
		approvalRequestNewUser: string;
		usernameChangeRequest: string;
		userLeft: string;
		userBanned: string;
		rules: string;
	};
	titles: {
		approvalRequest: string;
		usernameChangeRequest: string;
		userLeft: string;
		userBanned: string;
		rules: string;
	};
}

export interface ErrorsType {
	missingDataOrExecute: string;
	usernameUsedWithAnotherAccount: string;
	userResponseTimeout: string;
	interaction: {
		buttonExecution: string;
		buttonNotFound: string;
		commandExecution: string;
		commandNotFound: string;
		unauthorized: string;
	};
	discord: {
		cantReadLogs: string;
		noDiscordUserWithThisUuid: string;
		notRepliable: string;
	};
	api: {
		couldNotConnectToApi: string;
		noMojangAccountWithThatUsername: string;
		noMojangAccountWithThatUuid: string;
	};
	database: {
		invalidStatus: string;
		notUnique: string;
		notUniqueMinecraft: string;
		unknownError: string;
		userDoesNotExist: string;
	};
	rcon: {
		connexionError: string;
		add: string;
		edit: string;
		remove: string;
	};
}

export interface LogsType {
	ready: string;
	memberClickedRegisterButton: string;
	memberLeft: string;
	playerRoleWasRemoved: string;
}

export interface ServicesType {
	html: {
		style: string;
		script: string;
		template: string;
		templateWithStatus: string;
		rowTemplate: string;
		rowTemplateWithStatus: string;
	};
	userStatus: {
		cantSendDm: string;
		dmAddedToWhitelist: string;
		dmRemovedFromWhitelist: string;
		statusChanged: string;
	};
}

export interface UtilsType {
	createdPlayerRole: string;
}