import { lang } from '../bot-constants';
import { error } from '../services/logger';

export const strings = getStrings();

export function getStrings(): any {
	try {
		return require(`./${lang}.ts`);
	}
	catch (e) {
		error(e);
	}
}