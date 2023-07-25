import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usernamesUniqueKey, usersKey, usernamesKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {
	const decimalId = await client.zScore(usernamesKey(), username);

	if (!decimalId) throw new Error('User not found');

	const userId = decimalId.toString(16);

	const user = await client.hGetAll(usersKey(userId));

	if (!Object.keys(user).length) throw new Error('Something went wrong');

	return deserialize(userId, user);
};

export const getUserById = async (id: string) => {
	const user = await client.hGetAll(usersKey(id));

	return deserialize(id, user);
};

export const createUser = async (user: CreateUserAttrs) => {
	const id = genId();

	const exists = await client.sIsMember(usernamesUniqueKey(), user.username);

	if (exists) throw new Error('Username is taken');

	await client.hSet(usersKey(id), serialize(user));

	await client.sAdd(usernamesUniqueKey(), user.username);

	await client.zAdd(usernamesKey(), { value: user.username, score: Number.parseInt(id, 16) });

	return id;
};

const serialize = (user: CreateUserAttrs) => {
	return {
		username: user.username,
		password: user.password
	};
};

const deserialize = (id: string, user: Record<string, string>) => {
	return {
		id,
		username: user.username,
		password: user.password
	};
};
