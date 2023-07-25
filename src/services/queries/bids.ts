import { bidHistoryKey, itemsKey, itemsByPriceKey } from '$services/keys';
import { client, withLock } from '$services/redis';
import type { CreateBidAttrs, Bid } from '$services/types';
import { DateTime } from 'luxon';
import { getItem } from './items';

export const createBid = async (attrs: CreateBidAttrs) => {
	return withLock(attrs.itemId, async (lockedClient: typeof client) => {
		const item = await getItem(attrs.itemId);

		if (!item) throw new Error('Item not found');

		if (item.price >= attrs.amount) throw new Error('Bid too low');

		if (item.endingAt.diff(DateTime.now()).toMillis() < 0)
			throw new Error('Item closed for bidding');

		const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

		return Promise.all([
			lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
			lockedClient.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			}),
			lockedClient.zAdd(itemsByPriceKey(), { value: attrs.itemId, score: attrs.amount })
		]);
	});

	// return client.executeIsolated(async (isolatedClient) => {
	// 	await isolatedClient.watch(itemsKey(attrs.itemId));

	// 	const item = await getItem(attrs.itemId);

	// 	if (!item) throw new Error('Item not found');

	// 	if (item.price >= attrs.amount) throw new Error('Bid too low');

	// 	if (item.endingAt.diff(DateTime.now()).toMillis() < 0)
	// 		throw new Error('Item closed for bidding');

	// 	const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

	// 	return isolatedClient
	// 		.multi()
	// 		.rPush(bidHistoryKey(attrs.itemId), serialized)
	// 		.hSet(itemsKey(item.id), {
	// 			bids: item.bids + 1,
	// 			price: attrs.amount,
	// 			highestBidUserId: attrs.userId
	// 		})
	// 		.zAdd(itemsByPriceKey(), { value: attrs.itemId, score: attrs.amount })
	// 		.exec();
	// });
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const range = await client.lRange(bidHistoryKey(itemId), -1 * offset - count, -1 - offset);
	return range.map((item) => deserializeHistory(item));
};

const serializeHistory = (amount: number, createdAt: number) => {
	return `${amount}:${createdAt}`;
};

const deserializeHistory = (stored: string) => {
	const [amount, createdAt] = stored.split(':');
	return { amount: Number(amount), createdAt: DateTime.fromMillis(Number(createdAt)) };
};
