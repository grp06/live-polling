import { kv } from "@vercel/kv";

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
  const value = await kv.hgetall<Record<string, string>>(key);
  if (value === null || value === undefined) {
    return {};
  }
  for (const entry of Object.values(value)) {
    if (typeof entry !== "string") {
      throw new Error(`Expected string hash values for key ${key}`);
    }
  }
  return value;
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
