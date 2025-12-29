import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Simple caching hook untuk API requests
 * Mencegah multiple requests yang sama dan cache hasil
 */
const cache = new Map();
const pendingRequests = new Map();

export function useApiCache(endpoint, options = {}) {
  const {
    enabled = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    staleTime = 1 * 60 * 1000, // 1 minute default
    refetchOnMount = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);

    // Return cached data if still fresh and not forcing refresh
    if (!force && cached) {
      const now = Date.now();
      if (now - cached.timestamp < staleTime) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey) && !force) {
      try {
        const pendingData = await pendingRequests.get(cacheKey);
        setData(pendingData);
        setLoading(false);
        setError(null);
        return;
      } catch (err) {
        // Continue to make new request
      }
    }

    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { apiRequest } = await import('../config/api');
      const requestPromise = apiRequest(endpoint, {
        ...options,
        signal,
      });

      pendingRequests.set(cacheKey, requestPromise);

      const response = await requestPromise;

      if (signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch: ${response.status}`);
      }

      const result = await response.json();

      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      // Clean up old cache entries
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > cacheTime) {
          cache.delete(key);
        }
      }

      setData(result);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('API Error:', err);
      setError(err.message || 'An error occurred');
      setData(null);
    } finally {
      pendingRequests.delete(cacheKey);
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [endpoint, enabled, staleTime, cacheTime, JSON.stringify(options)]);

  useEffect(() => {
    if (enabled) {
      fetchData(refetchOnMount);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, refetchOnMount]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Clear cache for specific endpoint or all cache
 */
export function clearApiCache(endpoint = null) {
  if (endpoint) {
    for (const key of cache.keys()) {
      if (key.startsWith(endpoint)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  pendingRequests.clear();
}

