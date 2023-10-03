const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

export const tags = sequelize.define('tags', {
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

export async function createUser(minecraftUuid: string, discordUuid: string) {
	try {
		await tags.create({
			minecraft_uuid: minecraftUuid,
			discord_uuid: discordUuid,
		});

		console.log(`Un utilisateur a été ajouté avec le UUID Disocrd ${discordUuid} et le UUID Minecraft ${minecraftUuid}.`);
	}
	catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			throw new Error('Ce UUID Minecraft ou Discord existe déjà dans la base de données.');
		}

		throw new Error('Une erreur inconnue est survenue lors de l\'écriture dans la base de données.');
	}
};

export async function changeStatus(discordUuid: string, newStatus: number) {
	if (![0, 1, 2].includes(newStatus)) {
		throw new Error('Statut invalide');
	}

	const affectedRows = await this.tags.update({ inscription_status: newStatus }, { where: { discord_uuid: discordUuid } });

	if (affectedRows[0] === 0) {
		throw new Error('Cet utilisateur n\'est pas inscrit');
	}
};

export async function changeMinecraftUuid(discordUuid: string, minecraftUuid: string) {
	const affectedRows = await this.tags.update({ minecraft_uuid: minecraftUuid }, { where: { discord_uuid: discordUuid } });

	if (affectedRows[0] === 0) {
		throw new Error('Cet utilisateur n\'est pas inscrit');
	}
};

export async function getUserByDiscordUuid(discordUuid: string) {
	const tag = await this.tags.findOne({ where: { discord_uuid: discordUuid } });

	if (tag) {
		return structuredClone(tag.get({ plain: true }))
	}

	throw new Error('Cet utilisateur n\'existe pas!');
};

export async function getUsers(status?: number) {
	if (status == null) return await this.tags.findAll({ raw: true });
	return await this.tags.findAll({ where: { inscription_status: status }, raw: true });
};

export async function deleteEntryWithDiscordUuid(discordUuid: string) {
	const tagToDelete = await this.tags.findOne({ where: { discord_uuid: discordUuid } })
	if (tagToDelete === null) throw new Error('Cet utilisateur n\'est pas inscrit');
	tagToDelete.destroy();
}

export async function deleteEntry(id: number) {
	const tagToDelete = await this.tags.findOne({ where: { id: id } })
	if (tagToDelete === null) throw new Error('Cet utilisateur n\'est pas inscrit');
	tagToDelete.destroy();
}