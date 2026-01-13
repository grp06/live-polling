import { createClient } from "@vercel/kv";

const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
if (!kvUrl || !kvToken) {
  throw new Error(
    "@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN"
  );
}

const kv = createClient({
  url: kvUrl,
  token: kvToken,
  automaticDeserialization: false,
});

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const value = await kv.get<string>(key);
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected string value for key ${key}`);
  }
  return JSON.parse(value) as T;
}

export async function kvSetJson<T>(key: string, value: T): Promise<void> {
  await kv.set(key, JSON.stringify(value));
}

export async function kvDel(key: string): Promise<void> {
  await kv.del(key);
}

export async function kvHSet(
  key: string,
  field: string,
  value: string
): Promise<void> {
  await kv.hset(key, { [field]: value });
}

export async function kvHGet(key: string, field: string): Promise<string | null> {
  const value = await kv.hget<string>(key, field);
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected string hash value for key ${key}`);
  }
  return value;
}

export async function kvHGetAll(
  key: string
): Promise<Record<string, string>> {
  const value = await kv.hgetall<unknown>(key);
  if (value === null || value === undefined) {
    return {};
  }
  if (Array.isArray(value)) {
    if (value.length % 2 !== 0) {
      throw new Error(`Expected even hash entries for key ${key}`);
    }
    const normalized: Record<string, string> = {};
    for (let i = 0; i < value.length; i += 2) {
      const field = value[i];
      const entry = value[i + 1];
      if (typeof field !== "string" || typeof entry !== "string") {
        throw new Error(`Expected string hash values for key ${key}`);
      }
      normalized[field] = entry;
    }
    return normalized;
  }
  if (typeof value !== "object") {
    throw new Error(`Expected hash object for key ${key}`);
  }
  const entries = value as Record<string, unknown>;
  for (const entry of Object.values(entries)) {
    if (typeof entry !== "string") {
      throw new Error(`Expected string hash values for key ${key}`);
    }
  }
  return entries as Record<string, string>;
}

export async function kvLPushJson<T>(key: string, value: T): Promise<void> {
  await kv.lpush(key, JSON.stringify(value));
}

export async function kvLRangeJson<T>(
  key: string,
  start: number,
  stop: number
): Promise<T[]> {
  const values = await kv.lrange<string[]>(key, start, stop);
  return values.map((entry) => {
    if (typeof entry !== "string") {
      throw new Error(`Expected string list entries for key ${key}`);
    }
    return JSON.parse(entry) as T;
  });
}
