import { itemsIndexKey } from '$services/keys';
import { client } from '$services/redis';
import { deserialize } from './deserialize';

export const searchItems = async (term: string, size: number = 5) => {
	const search = term
		.replaceAll(/[^a-zA-Z0-9 ]/g, '')
		.trim()
		.split(' ')
		.map((word) => (word ? `%${word}%` : ''))
		.join(' ');

	if (!search) return;

	const query = `(@name:(${search}) => { $weight: 5.0 }) | (@description:(${search}))`;

	const { documents } = await client.ft.search(itemsIndexKey(), query, {
		LIMIT: { from: 0, size }
	});

	return documents.map(({ id, value }) => deserialize(id, value as any));
};
