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
    if (!parsed || parsed.data === undefined) return null;

    return parsed.data;
  } catch (err) {
    console.warn(`[Cache Read Error] Key: ${key}`, err);
    return null;
  }
}

/**
 * Resilient HTTP GET/POST/PUT request wrapper with timeout and exponential backoff retry.
 */
export async function fetchWithRetry(
  url,
  config = {},
  options = { timeout: 15000, maxRetries: 2, backoffMs: 1000, method: "get" }
) {
  const { timeout = 15000, maxRetries = 2, backoffMs = 1000, method = "get" } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const mergedConfig = {
        ...config,
        signal: controller.signal,
      };

      let response;
      const httpMethod = (method || "get").toLowerCase();
      if (httpMethod === "get") {
        response = await axios.get(url, mergedConfig);
      } else if (httpMethod === "post") {
        response = await axios.post(url, config.data || {}, mergedConfig);
      } else if (httpMethod === "put") {
        response = await axios.put(url, config.data || {}, mergedConfig);
      } else if (httpMethod === "delete") {
        response = await axios.delete(url, mergedConfig);
      } else {
        response = await axios.get(url, mergedConfig);
      }

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
 * Stale-While-Revalidate wrapper:
 * Immediately returns cached data if available, then fetches fresh data in background.
 */
export async function fetchWithCache(
  url,
  config = {},
  cacheKey,
  onDataUpdate,
  options = { timeout: 15000, maxRetries: 2 }
) {
  // 1. Instantly deliver cached data if present
  const cachedData = cacheKey ? getCache(cacheKey) : null;
  if (cachedData !== null && typeof onDataUpdate === "function") {
    onDataUpdate(cachedData, true); // true indicates stale/cached
  }

  // 2. Fetch fresh data in background
  try {
    const res = await fetchWithRetry(url, config, options);
    if (res && res.data !== undefined) {
      if (cacheKey) setCache(cacheKey, res.data);
      if (typeof onDataUpdate === "function") {
        onDataUpdate(res.data, false); // false indicates fresh
      }
    }
    return res;
  } catch (err) {
    console.warn(`[Network Fetch Error] URL: ${url}. Falling back to cache.`, err);
    if (cachedData !== null) {
      return { data: cachedData, fromCache: true };
    }
    throw err;
  }
}

/**
 * Helper to check current online status
 */
export function isOnline() {
  if (typeof window === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * Debounce function to limit rapid calls on high latency networks
 */
export function debounce(func, delay = 350) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}


