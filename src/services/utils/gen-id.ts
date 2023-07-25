import { randomBytes } from 'crypto';

export const genId = () => {
	return randomBytes(5).toString('hex');
};
