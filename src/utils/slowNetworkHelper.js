import axios from "redaxios";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours default TTL

/**
 * Save data to LocalStorage with timestamp
 */
export function setCache(key, data) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`digicrm_cache_${key}`, JSON.stringify(payload));
  } catch (err) {
    console.warn(`[Cache Write Error] Key: ${key}`, err);
  }
}

/**
 * Get data from LocalStorage if present
 */
export function getCache(key, maxAgeMs = CACHE_TTL_MS) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`digicrm_cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;

    // Return cached data (stale-while-revalidate)
    if (maxAgeMs && Date.now() - parsed.timestamp > maxAgeMs) {
      return parsed.data;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[Cache Read Error] Key: ${key}`, err);
    return null;
  }
}

/**
 * Resilient HTTP GET request wrapper with timeout and exponential backoff retry.
 */
export async function fetchWithRetry(
  url,
  config = {},
  options = { timeout: 12000, maxRetries: 2, backoffMs: 1000 }
) {
  const { timeout = 12000, maxRetries = 2, backoffMs = 1000 } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const mergedConfig = {
        ...config,
        signal: controller.signal,
      };

      const response = await axios.get(url, mergedConfig);
      clearTimeout(timer);
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Helper to check current online status
 */
export function isOnline() {
  if (typeof window === "undefined") return true;
  return navigator.onLine !== false;
}
