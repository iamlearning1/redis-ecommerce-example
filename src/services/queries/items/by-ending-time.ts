import { itemsByEndingAtKey, itemsKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

export const itemsByEndingTime = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	const ids = await client.zRangeByScore(itemsByEndingAtKey(), Date.now(), '+inf', {
		LIMIT: {
			offset,
			count
		}
	});

	const items = await Promise.all(ids.map((id) => client.hGetAll(itemsKey(id))));

	return items.map((item, idx) => deserialize(ids[idx], item));
};
