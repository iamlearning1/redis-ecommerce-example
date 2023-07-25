import { client } from '$services/redis';

export const incrementView = async (itemId: string, userId: string) =>
	client.incrementView(itemId, userId);
