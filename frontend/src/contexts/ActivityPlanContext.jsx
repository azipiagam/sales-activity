import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '../config/api';
import { format } from 'date-fns';

const ActivityPlanContext = createContext(null);

// Global cache and pending requests
const cache = new Map();
const pendingRequests = new Map();
const CACHE_TIME = 30 * 1000; // 30 seconds
const STALE_TIME = 10 * 1000; // 10 seconds

export function ActivityPlanProvider({ children }) {
  const [dataByDate, setDataByDate] = useState(new Map());
  const [allPlans, setAllPlans] = useState(null);
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [errorStates, setErrorStates] = useState(new Map());

  const fetchPlansByDate = useCallback(async (date, force = false) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const cacheKey = `date:${dateStr}`;
    
    // Check cache first
    if (!force) {
      const cached = cache.get(cacheKey);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < STALE_TIME) {
          setDataByDate(prev => {
            const newMap = new Map(prev);
            newMap.set(dateStr, cached.data);
            return newMap;
          });
          setLoadingStates(prev => {
            const newMap = new Map(prev);
            newMap.set(cacheKey, false);
            return newMap;
          });
          return cached.data;
        }
      }
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey) && !force) {
      try {
        const pendingData = await pendingRequests.get(cacheKey);
        setDataByDate(prev => {
          const newMap = new Map(prev);
          newMap.set(dateStr, pendingData);
          return newMap;
        });
        return pendingData;
      } catch (err) {
        // Continue to make new request
      }
    }

    // Set loading state
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.set(cacheKey, true);
      return newMap;
    });
    setErrorStates(prev => {
      const newMap = new Map(prev);
      newMap.set(cacheKey, null);
      return newMap;
    });

    try {
      const endpoint = `activity-plans?date=${dateStr}`;
      const requestPromise = apiRequest(endpoint);
      
      pendingRequests.set(cacheKey, requestPromise);
      
      const response = await requestPromise;
      
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

      // Update state
      setDataByDate(prev => {
        const newMap = new Map(prev);
        newMap.set(dateStr, result);
        return newMap;
      });
      
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, false);
        return newMap;
      });

      pendingRequests.delete(cacheKey);
      return result;
    } catch (err) {
      console.error('Error fetching plans by date:', err);
      setErrorStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, err.message);
        return newMap;
      });
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, false);
        return newMap;
      });
      pendingRequests.delete(cacheKey);
      throw err;
    }
  }, []);

  const fetchAllPlans = useCallback(async (force = false) => {
    const cacheKey = 'all';
    
    // Check cache first
    if (!force) {
      const cached = cache.get(cacheKey);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < STALE_TIME) {
          setAllPlans(cached.data);
          setLoadingStates(prev => {
            const newMap = new Map(prev);
            newMap.set(cacheKey, false);
            return newMap;
          });
          return cached.data;
        }
      }
    }

    // Check if request is already pending
    if (pendingRequests.has(cacheKey) && !force) {
      try {
        const pendingData = await pendingRequests.get(cacheKey);
        setAllPlans(pendingData);
        return pendingData;
      } catch (err) {
        // Continue to make new request
      }
    }

    // Set loading state
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.set(cacheKey, true);
      return newMap;
    });
    setErrorStates(prev => {
      const newMap = new Map(prev);
      newMap.set(cacheKey, null);
      return newMap;
    });

    try {
      const endpoint = 'activity-plans/all';
      const requestPromise = apiRequest(endpoint);
      
      pendingRequests.set(cacheKey, requestPromise);
      
      const response = await requestPromise;
      
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

      // Update state
      setAllPlans(result);
      
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, false);
        return newMap;
      });

      pendingRequests.delete(cacheKey);
      return result;
    } catch (err) {
      console.error('Error fetching all plans:', err);
      setErrorStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, err.message);
        return newMap;
      });
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(cacheKey, false);
        return newMap;
      });
      pendingRequests.delete(cacheKey);
      throw err;
    }
  }, []);

  const invalidateCache = useCallback((date = null) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const cacheKey = `date:${dateStr}`;
      cache.delete(cacheKey);
      setDataByDate(prev => {
        const newMap = new Map(prev);
        newMap.delete(dateStr);
        return newMap;
      });
    } else {
      // Clear all caches
      cache.clear();
      setDataByDate(new Map());
      setAllPlans(null);
    }
  }, []);

  // Optimistic update: langsung update plan di cache tanpa perlu fetch ulang
  const updatePlanInCache = useCallback((planId, updates) => {
    let foundInDataByDate = false;
    
    // Update di dataByDate (per tanggal)
    setDataByDate(prev => {
      const newMap = new Map(prev);
      
      for (const [dateStr, plans] of newMap.entries()) {
        const updatedPlans = plans.map(plan => {
          if (plan.id === planId) {
            foundInDataByDate = true;
            return { ...plan, ...updates };
          }
          return plan;
        });
        
        if (foundInDataByDate) {
          newMap.set(dateStr, updatedPlans);
          // Update cache juga
          const cacheKey = `date:${dateStr}`;
          const cached = cache.get(cacheKey);
          if (cached) {
            cache.set(cacheKey, {
              data: updatedPlans,
              timestamp: cached.timestamp,
            });
          }
          break;
        }
      }
      
      return newMap;
    });

    // Update di allPlans juga
    setAllPlans(prev => {
      if (!prev) return prev;
      
      const updatedAllPlans = prev.map(plan => {
        if (plan.id === planId) {
          return { ...plan, ...updates };
        }
        return plan;
      });
      
      // Update cache untuk all plans
      const cached = cache.get('all');
      if (cached) {
        cache.set('all', {
          data: updatedAllPlans,
          timestamp: cached.timestamp,
        });
      }
      
      return updatedAllPlans;
    });
  }, []);

  // Remove plan dari cache (untuk delete atau reschedule ke tanggal lain)
  const removePlanFromCache = useCallback((planId, date = null) => {
    // Remove dari dataByDate
    setDataByDate(prev => {
      const newMap = new Map(prev);
      
      if (date) {
        // Remove dari tanggal spesifik
        const dateStr = format(date, 'yyyy-MM-dd');
        const plans = newMap.get(dateStr);
        if (plans) {
          const filteredPlans = plans.filter(plan => plan.id !== planId);
          if (filteredPlans.length === 0) {
            newMap.delete(dateStr);
          } else {
            newMap.set(dateStr, filteredPlans);
          }
          
          // Update cache juga
          const cacheKey = `date:${dateStr}`;
          const cached = cache.get(cacheKey);
          if (cached) {
            cache.set(cacheKey, {
              data: filteredPlans,
              timestamp: cached.timestamp,
            });
          }
        }
      } else {
        // Remove dari semua tanggal
        for (const [dateStr, plans] of newMap.entries()) {
          const filteredPlans = plans.filter(plan => plan.id !== planId);
          if (filteredPlans.length === 0) {
            newMap.delete(dateStr);
          } else {
            newMap.set(dateStr, filteredPlans);
          }
          
          // Update cache juga
          const cacheKey = `date:${dateStr}`;
          const cached = cache.get(cacheKey);
          if (cached) {
            cache.set(cacheKey, {
              data: filteredPlans,
              timestamp: cached.timestamp,
            });
          }
        }
      }
      
      return newMap;
    });

    // Remove dari allPlans juga
    setAllPlans(prev => {
      if (!prev) return prev;
      
      const filteredPlans = prev.filter(plan => plan.id !== planId);
      
      // Update cache untuk all plans
      const cached = cache.get('all');
      if (cached) {
        cache.set('all', {
          data: filteredPlans,
          timestamp: cached.timestamp,
        });
      }
      
      return filteredPlans;
    });
  }, []);

  const getPlansByDate = useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dataByDate.get(dateStr) || null;
  }, [dataByDate]);

  const isLoading = useCallback((key) => {
    return loadingStates.get(key) || false;
  }, [loadingStates]);

  const getError = useCallback((key) => {
    return errorStates.get(key) || null;
  }, [errorStates]);

  // Cleanup old cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TIME) {
          cache.delete(key);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const value = {
    fetchPlansByDate,
    fetchAllPlans,
    getPlansByDate,
    allPlans,
    dataByDate, // Expose untuk trigger re-render ketika data berubah
    isLoading,
    getError,
    invalidateCache,
    updatePlanInCache,
    removePlanFromCache,
  };

  return (
    <ActivityPlanContext.Provider value={value}>
      {children}
    </ActivityPlanContext.Provider>
  );
}

export function useActivityPlans() {
  const context = useContext(ActivityPlanContext);
  if (!context) {
    throw new Error('useActivityPlans must be used within ActivityPlanProvider');
  }
  return context;
}

