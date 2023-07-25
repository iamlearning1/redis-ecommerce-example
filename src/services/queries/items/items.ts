import { itemsByViewsKey, itemsByEndingAtKey, itemsKey, itemsByPriceKey } from '$services/keys';
import { client } from '$services/redis';
import type { CreateItemAttrs } from '$services/types';
import { genId } from '$services/utils';
import { deserialize } from './deserialize';
import { serialize } from './serialize';

export const getItem = async (itemId: string) => {
	const item = await client.hGetAll(itemsKey(itemId));

	return !Object.keys(item).length ? null : deserialize(itemId, item);
};

export const getItems = async (ids: string[]) => {
	const commands = ids.map((id) => client.hGetAll(itemsKey(id)));

	const items = await Promise.all(commands);

	return items.map((item, idx) => (!Object.keys(item).length ? null : deserialize(idx[idx], item)));
};

export const createItem = async (attrs: CreateItemAttrs) => {
	const itemId = genId();
	const serialized = serialize(attrs);

	await Promise.all([
		client.hSet(itemsKey(itemId), serialized),
		client.zAdd(itemsByViewsKey(), { value: itemId, score: 0 }),
		client.zAdd(itemsByEndingAtKey(), { value: itemId, score: attrs.endingAt.toMillis() }),
		client.zAdd(itemsByPriceKey(), { value: itemId, score: 0 })
	]);

	return itemId;
};
