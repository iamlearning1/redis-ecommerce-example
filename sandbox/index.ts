import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
	// const result = await client.zAdd('products', [
	// 	{ value: 'monitor', score: 45 },
	// 	{ value: 'chalk', score: 20.2 },
	// 	{ value: 'yellow', score: -1.2 }
	// ]);

	const result = await client.zRem('products', 'z');

	console.log(result);
};
run();
