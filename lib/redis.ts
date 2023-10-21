import weaviate, { ApiKey, WeaviateClient } from 'weaviate-ts-client';

import { createClient } from 'redis';

export const client = createClient({
    password: 'g5Un7rDhBAEOlOnihWzsp1dvXtO1iKPq',
    socket: {
        host: 'redis-16730.c15.us-east-1-4.ec2.cloud.redislabs.com',
        port: 16730,
    },
});
