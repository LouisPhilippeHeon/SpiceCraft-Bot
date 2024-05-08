import { inscriptionStatus } from '../bot-constants';
import { SpiceCraftError } from '../models/error';
import { UserFromDb } from '../models';
const Sequelize = require('sequelize');
import { Errors } from '../strings';

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
	define: { 'underscored': true }
});

const tags = sequelize.define('tags', {
	discord_uuid: {
		type: Sequelize.STRING,
		unique: true,
	},
	minecraft_uuid: {
		type: Sequelize.STRING,
		unique: true,
	},
	inscription_status: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

export async function syncTags() {
	await tags.sync();
}

export async function drop() {
	await sequelize.drop('tags');
	await syncTags();
}

export async function createUser(discordUuid: string, minecraftUuid: string, status = inscriptionStatus.awaitingApproval): Promise<UserFromDb> {
	try {
		const tag = await tags.create({
			discord_uuid: discordUuid,
			minecraft_uuid: minecraftUuid,
			inscription_status: status
		});

		return Object.assign(new UserFromDb(), tag.get({ plain: true }))
	}
	catch (e) {
		if (e.name === 'SequelizeUniqueConstraintError')
			throw new SpiceCraftError(Errors.database.notUnique);

		throw new SpiceCraftError(Errors.database.unknownError);
	}
}

export async function changeStatus(discordUuid: string, newStatus: number) {
	if (![0, 1, 2].includes(newStatus)) throw new SpiceCraftError(Errors.database.invalidStatus);

	const affectedRows = await tags.update({ inscription_status: newStatus }, { where: { discord_uuid: discordUuid }});

	if (affectedRows[0] === 0)
		throw new SpiceCraftError(Errors.database.userDoesNotExist);
}

export async function changeMinecraftUuid(discordUuid: string, minecraftUuid: string) {
	let isUnchanged;

	try {
		const affectedRows = await tags.update({ minecraft_uuid: minecraftUuid }, { where: { discord_uuid: discordUuid }});
		isUnchanged = (affectedRows[0] === 0);
	}
	catch (e) {
		if (e.name === 'SequelizeUniqueConstraintError')
			throw new SpiceCraftError(Errors.database.notUnique);

		throw new SpiceCraftError(Errors.database.unknownError);
	}

	if (isUnchanged)
		throw new SpiceCraftError(Errors.database.userDoesNotExist);
}

export async function getUserByDiscordUuid(discordUuid: string): Promise<UserFromDb> {
	const tag = await tags.findOne({ where: { discord_uuid: discordUuid }});

	if (!tag)
		throw new SpiceCraftError(Errors.database.userDoesNotExist);

	return Object.assign(new UserFromDb(), tag.get({ plain: true }));
}

export async function getUserByMinecraftUuid(minecraftUuid: string): Promise<UserFromDb> {
	const tag = await tags.findOne({ where: { minecraft_uuid: minecraftUuid }});

	if (!tag)
		throw new SpiceCraftError(Errors.database.userDoesNotExist);

	return Object.assign(new UserFromDb(), tag.get({ plain: true }));
}

export async function getUsers(status?: number): Promise<UserFromDb[]> {
	if (status === undefined)
		return await tags.findAll({ raw: true });

	return await tags.findAll({ where: { inscription_status: status }, raw: true });
}

export async function deleteEntry(discordUuid: string) {
	const tagToDelete = await tags.findOne({ where: { discord_uuid: discordUuid }})

	if (!tagToDelete)
		throw new SpiceCraftError(Errors.database.userDoesNotExist);

	tagToDelete.destroy();
}