import { createClient } from "redis";


const redis = await createClient().connect();
export function getRedisClient() {
    return redis;
}