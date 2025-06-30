import { v4 as uuidv4 } from 'uuid';

export const getUniqueID = (record: Record<string, any>) => {
	let newKey: string;
	do {
		newKey = uuidv4();
	} while (Object.prototype.hasOwnProperty.call(record, newKey));
	return newKey;
}