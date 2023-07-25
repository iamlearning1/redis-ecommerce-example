import { randomBytes } from 'crypto';
import { client } from './client';

export const withLock = async (key: string, cb: (redisClient: Client) => void) => {
	const retryDelayTime = 100;
	let noOfRetries = 20;

	const timeout = retryDelayTime * noOfRetries;

	const token = randomBytes(6).toString('hex');

	const lockKey = `lock:${key}`;

	while (noOfRetries) {
		noOfRetries -= 1;

		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: timeout
		});

		if (!acquired) {
			await pause(retryDelayTime);
			continue;
		}

		try {
			const proxiedClient = buildClientProxy(timeout);

			await cb(proxiedClient);
		} finally {
			await client.unlock(lockKey, token);
			noOfRetries = 0;
		}
	}
};

type Client = typeof client;

const buildClientProxy = (timeout: number): Client => {
	const startTime = Date.now();

	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeout) {
				throw new Error('Lock Expired');
			}

			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
