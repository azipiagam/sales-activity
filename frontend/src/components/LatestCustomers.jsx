import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import { apiRequest } from '../config/api';
import { getSales } from '../utils/auth';

// Simple in-memory cache so navigating back to Dashboard doesn't re-trigger loading UI (same pattern as chart).
const latestCustomersCache = new Map(); // key -> { data, timestamp }
const pendingLatestCustomersRequests = new Map(); // key -> Promise
const LATEST_CUSTOMERS_STALE_TIME = 30 * 1000; // 30s

const mapWeeklyCustomers = (payload) => {
  const periodKey = 'weekly';
  const rows = Array.isArray(payload?.data?.[periodKey]) ? payload.data[periodKey] : [];
  return rows.map((row) => ({
    id: row.customer_id ?? null,
    customer_name: row.customer_name,
    visit_count: Number(row.visit_count) || 0,
  }));
};

export default function LatestCustomers({ refreshKey }) {
  const salesInternalId = getSales()?.internal_id;
  const customersCacheKey = salesInternalId ? `latest-customers:${salesInternalId}` : null;
  const lastRefreshKeyRef = useRef(refreshKey);

  const [customers, setCustomers] = useState(() => {
    if (!customersCacheKey) return [];
    return latestCustomersCache.get(customersCacheKey)?.data ?? [];
  });

  const [loading, setLoading] = useState(() => {
    if (!customersCacheKey) return false;
    return !(latestCustomersCache.get(customersCacheKey));
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCustomers = async () => {
      try {
        if (!salesInternalId || !customersCacheKey) {
          if (isMounted) {
            setCustomers([]);
            setLoading(false);
          }
          return;
        }

        const isManualRefresh = refreshKey !== lastRefreshKeyRef.current;
        lastRefreshKeyRef.current = refreshKey;

        if (isManualRefresh) {
          latestCustomersCache.delete(customersCacheKey);
          pendingLatestCustomersRequests.delete(customersCacheKey);
        }

        const cached = isManualRefresh ? null : latestCustomersCache.get(customersCacheKey);
        const hasCachedData = Boolean(cached && Array.isArray(cached.data));

        if (hasCachedData && isMounted) {
          setCustomers(cached.data);
          setLoading(false);
        } else if (isMounted) {
          setLoading(true);
        }

        if (!isManualRefresh && cached) {
          const age = Date.now() - cached.timestamp;
          if (age < LATEST_CUSTOMERS_STALE_TIME) {
            if (isMounted) {
              setLoading(false);
            }
            return;
          }
        }

        let requestPromise = pendingLatestCustomersRequests.get(customersCacheKey);
        if (!requestPromise || isManualRefresh) {
          requestPromise = (async () => {
            const query = new URLSearchParams({ sales_internal_id: salesInternalId }).toString();
            const response = await apiRequest(`dashboard/customer-visits?${query}`);

            if (!response.ok) {
              throw new Error(`Failed to fetch customers (${response.status})`);
            }

            const payload = await response.json();
            return mapWeeklyCustomers(payload);
          })();

          const trackedPromise = requestPromise;
          pendingLatestCustomersRequests.set(customersCacheKey, trackedPromise);
          trackedPromise.finally(() => {
            if (pendingLatestCustomersRequests.get(customersCacheKey) === trackedPromise) {
              pendingLatestCustomersRequests.delete(customersCacheKey);
            }
          });
        }

        const mappedCustomers = await requestPromise;

        if (!isMounted) {
          return;
        }

        latestCustomersCache.set(customersCacheKey, {
          data: mappedCustomers,
          timestamp: Date.now(),
        });

        setCustomers(mappedCustomers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching latest customers:', err);
        if (isMounted) {
          const cached = customersCacheKey ? latestCustomersCache.get(customersCacheKey) : null;
          setCustomers(cached?.data ?? []);
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      isMounted = false;
    };
  }, [salesInternalId, customersCacheKey, refreshKey]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCustomers = normalizedQuery
    ? customers.filter((customer) => {
        const name = String(customer.customer_name ?? '').toLowerCase();
        return name.includes(normalizedQuery);
      })
    : customers;

  return (
    <Box 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 3 },
        mb: { xs: 3, sm: 4, md: 4 },
        px: 0,
      }}
    >
      <Card
        elevation={0}
        sx={{
          background: '#FFFFFF',
          borderRadius: { xs: '12px', sm: '14px', md: '16px' },
          padding: { xs: '16px', sm: '20px', md: '24px' },
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          border: 'none',
          width: '100%',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              fontWeight: 700,
              color: '#6BA3D0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <PeopleIcon
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
                color: '#6BA3D0',
              }}
            />
            Customers
          </Typography>
          <IconButton
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) {
                setSearchQuery('');
              }
            }}
            sx={{
              color: '#6BA3D0',
              padding: { xs: '8px', sm: '10px' },
              '&:hover': {
                backgroundColor: 'rgba(107, 163, 208, 0.1)',
              },
            }}
          >
            <SearchIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
        </Box>

        {isSearchOpen && (
          <Box sx={{ mb: 2 }}>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer..."
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(107, 163, 208, 0.06)',
                },
                '& .MuiInputBase-input': {
                  color: '#6BA3D0',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#6BA3D0',
                  opacity: 1,
                },
              }}
            />
          </Box>
        )}

        {/* Customer List */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#6BA3D0',
                fontSize: '0.875rem',
              }}
            >
              Loading...
            </Typography>
          </Box>
        ) : customers.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, #F9FAFB 45%, #F3F4F6 100%)',
                border: '1px dashed #D1D5DB',
                boxShadow: 'inset 0px 0px 0px 1px rgba(255,255,255,0.6)',
              }}
            >
              <PersonOffOutlinedIcon sx={{ fontSize: 44, color: '#9CA3AF' }} />
            </Box>
          </Box>
        ) : filteredCustomers.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, #F9FAFB 45%, #F3F4F6 100%)',
                border: '1px dashed #D1D5DB',
                boxShadow: 'inset 0px 0px 0px 1px rgba(255,255,255,0.6)',
              }}
            >
              <PersonOffOutlinedIcon sx={{ fontSize: 44, color: '#9CA3AF' }} />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            {filteredCustomers.map((customer, index) => (
              <Box
                key={customer.id || index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: { xs: 1, sm: 1.5 },
                  borderBottom:
                    index < filteredCustomers.length - 1 ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '0.9375rem', sm: '1rem' },
                      fontWeight: 500,
                      color: '#6BA3D0',
                    }}
                  >
                    {customer.customer_name || 'N/A'}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    color: '#6BA3D0',
                    fontWeight: 600,
                    ml: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {customer.visit_count ?? 0}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}
