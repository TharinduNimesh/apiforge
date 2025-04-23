import { createClient } from 'redis'
import { useRuntimeConfig } from '#imports'

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    const config = useRuntimeConfig()
    redisClient = createClient();

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    await redisClient.connect()
  }
  return redisClient
}

// Rate limiting helpers
export async function getRateLimit(key: string): Promise<number> {
  const client = await getRedisClient()
  const count = await client.get(key)
  return parseInt(count || '0', 10)
}

export async function incrementRateLimit(key: string, ttl: number): Promise<void> {
  const client = await getRedisClient()
  const multi = client.multi()
  multi.incr(key)
  multi.expire(key, ttl)
  await multi.exec()
}

export async function setRateLimit(key: string, value: number, ttl: number): Promise<void> {
  const client = await getRedisClient()
  await client.setEx(key, ttl, value.toString())
}