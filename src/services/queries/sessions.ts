import { sessionsKey } from '$services/keys';
import { client } from '$services/redis';
import type { Session } from '$services/types';

export const getSession = async (id: string) => {
	const session: unknown = await client.hGetAll(sessionsKey(id));

	return !Object.keys(session).length ? null : deserialize(id, session as Session);
};

export const saveSession = async (session: Session) => {
	return client.hSet(sessionsKey(session.id), serialize(session));
};

const deserialize = (id: string, session: Session) => {
	return {
		id,
		userId: session.userId,
		username: session.username
	};
};

const serialize = (session: Session) => {
	return {
		userId: session.userId,
		username: session.username
	};
};
