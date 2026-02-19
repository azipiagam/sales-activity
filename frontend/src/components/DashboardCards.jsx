import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PieChart } from '@mui/x-charts/PieChart';
import { apiRequest } from '../config/api';
import { getSales } from '../utils/auth';

export default function DashboardCards({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Bulanan');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const filterOptions = ['Hari Ini', 'Mingguan', 'Bulanan'];

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (value) => {
    setTimeFilter(value);
    handleFilterClose();
  };


  useEffect(() => {
    let isMounted = true;

    const filterKeyByLabel = {
      'Hari Ini': 'daily',
      'Mingguan': 'weekly',
      'Bulanan': 'monthly',
    };

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const fetchStats = async () => {
      try {
        if (isMounted) {
          setIsLoadingStats(true);
        }

        const currentUser = getSales();
        const salesInternalId = currentUser?.internal_id;

        if (!salesInternalId) {
          if (isMounted) {
            setStats(null);
            setIsLoadingStats(false);
          }
          return;
        }

        const filterKey = filterKeyByLabel[timeFilter] || 'monthly';
        const query = new URLSearchParams({ sales_internal_id: salesInternalId }).toString();
        const response = await apiRequest(`dashboard/stats?${query}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch stats (${response.status})`);
        }

        const payload = await response.json();
        const selectedStats = payload?.data?.[filterKey];

        if (!selectedStats) {
          if (isMounted) {
            setStats(null);
            setIsLoadingStats(false);
          }
          return;
        }
        
        if (isMounted) {
          setStats({
            plan: toNumber(selectedStats.in_progress),
            missed: toNumber(selectedStats.missed),
            done: toNumber(selectedStats.done),
            reschedule: 0,
            cancel: 0,
          });
          setIsLoadingStats(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        if (isMounted) {
          setStats(null);
          setIsLoadingStats(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [timeFilter, refreshKey]);

  const totalStats = useMemo(() => {
    if (!stats) {
      return 0;
    }
    return stats.plan + stats.missed + stats.done;
  }, [stats]);

  const allCategories = useMemo(() => {
    const safeStats = stats ?? { plan: 0, done: 0, missed: 0 };
    return [
      { id: 1, label: 'Plan', value: safeStats.plan, color: '#6BA3D0' },
      { id: 2, label: 'Done', value: safeStats.done, color: '#34D399' },
      { id: 3, label: 'Missed', value: safeStats.missed, color: '#F87171' },
    ];
  }, [stats]);

  const pieChartData = useMemo(() => {
    return allCategories
      .filter(card => card.value > 0)
      .map((card) => ({
        id: card.id,
        value: card.value,
        label: card.label,
        color: card.color,
      }));
  }, [allCategories]);

  return (
    <Box
      sx={{
        mt: { xs: 2, sm: 3, md: 3 },
        mb: { xs: 3, sm: 4, md: 4 },
        px: { xs: 1, sm: 0 },
      }}
    >
      <Card
        elevation={0}
        sx={{
          background: '#FFFFFF',
          borderRadius: { xs: '12px', sm: '14px', md: '16px' },
          padding: { xs: '16px', sm: '20px', md: '24px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          border: 'none',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: { md: '800px', lg: '900px' },
          mx: { md: 'auto' },
        }}
      >
        {/* Filter Component */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: '100%',
            mb: 2,
          }}
        >
          <Button
            onClick={handleFilterClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.75, sm: 1 },
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: { xs: '6px 12px', sm: '8px 16px' },
              minWidth: { xs: '100px', sm: 'auto' },
              textTransform: 'none',
              color: '#333',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              flexShrink: 0,
            }}
          >
            <CalendarTodayIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: '#6BA3D0',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                fontWeight: 500,
                color: '#333',
              }}
            >
              {timeFilter}
            </Typography>
            <ExpandMoreIcon
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                color: '#666',
                transition: 'transform 0.2s ease-in-out',
                transform: filterAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </Button>

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                minWidth: 140,
              },
            }}
          >
            {filterOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={() => handleFilterChange(option)}
                selected={option === timeFilter}
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  padding: { xs: '10px 16px', sm: '12px 20px' },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(107, 163, 208, 0.1)',
                  },
                }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Pie Chart */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mb: 3,
            '& .MuiChartsLegend-root': {
              display: 'none !important',
            },
            '& .MuiChartsLegendContainer-root': {
              display: 'none !important',
            },
          }}
        >
          {isLoadingStats ? (
            <Skeleton
              variant="circular"
              width={170}
              height={170}
              sx={{ bgcolor: '#F3F4F6' }}
            />
          ) : totalStats > 0 && pieChartData.length > 0 ? (
            <PieChart
              series={[
                {
                  data: pieChartData.map(item => ({
                    id: item.id,
                    value: item.value,
                  })),
                  innerRadius: -18,
                  outerRadius: 60,
                  paddingAngle: 5,
                  cornerRadius: 5,
                  startAngle: -45,
                  endAngle: 225,
                  cx: 85,
                  cy: 85,
                }
              ]}
              width={170}
              height={170}
              slotProps={{
                legend: { hidden: true },
              }}
              margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
              colors={pieChartData.map(item => item.color)}
            />
          ) : (
            <Box
              sx={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                }}
              >
                No Data
              </Typography>
            </Box>
          )}
        </Box>

        {/* Status Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: { xs: 1.5, sm: 2 },
            width: '100%',
          }}
        >
          {isLoadingStats ? (
            <>
              {[1, 2, 3].map((idx) => (
                <Box
                  key={`status-skeleton-${idx}`}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    backgroundColor: '#FFFFFF',
                    padding: { xs: '10px', sm: '12px' },
                  }}
                >
                  <Skeleton
                    variant="text"
                    width={70}
                    height={18}
                    sx={{ transform: 'none', mb: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width={40}
                    height={24}
                    sx={{ transform: 'none' }}
                  />
                </Box>
              ))}
            </>
          ) : (
            allCategories.map((item) => (
              <Box
                key={item.id}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  backgroundColor: '#FFFFFF',
                  padding: { xs: '10px', sm: '12px' },
                  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: '#6B7280',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  {item.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    color: '#111827',
                    fontWeight: 700,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Card>
    </Box>
  );
}

