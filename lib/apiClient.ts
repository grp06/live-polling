export type FetchJsonOptions = {
  errorMessage: string;
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options: FetchJsonOptions
): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? options.errorMessage);
  }

  return payload as T;
}
