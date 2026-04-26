import { apiClient } from "../api/client";

let probeCache: boolean | null = null;
let endpointCache: string | null = null;

async function getMinioEndpoint(): Promise<string> {
  if (endpointCache) return endpointCache;
  const data = await apiClient.get<{ endpoint: string }>("/media/minio-endpoint");
  endpointCache = data.endpoint;
  return endpointCache;
}

export async function isMinioDirectAvailable(): Promise<boolean> {
  if (probeCache !== null) return probeCache;
  try {
    const endpoint = await getMinioEndpoint();
    await fetch(endpoint, {
      method: "HEAD",
      mode: "no-cors",
      signal: AbortSignal.timeout(3000),
    });
    probeCache = true;
  } catch {
    probeCache = false;
  }
  return probeCache;
}
