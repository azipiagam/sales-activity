import React, { useMemo, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import { alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PieChart } from '@mui/x-charts/PieChart';
import { apiRequest } from '../config/api';
import { getSales } from '../utils/auth';

export default function TaskDashboard({ selectedDate }) {
  const [bulananFilter, setBulananFilter] = useState('Bulanan');
  const [provinsiFilter, setProvinsiFilter] = useState('Semua Provinsi');
  const [bulananAnchorEl, setBulananAnchorEl] = useState(null);
  const [provinsiAnchorEl, setProvinsiAnchorEl] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getMenuWidth = (anchorEl) => {
    if (!anchorEl) return undefined;
    const { width } = anchorEl.getBoundingClientRect();
    return Number.isFinite(width) ? Math.round(width) : undefined;
  };

  const [taskData, setTaskData] = useState(null);
  const [stateStats, setStateStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const bulananOptions = ['Hari Ini', '7 Hari Terakhir', 'Bulan ini'];
  const provinsiOptions = useMemo(() => {
    const baseOptions = ['Semua Provinsi'];
    if (!stateStats) {
      return baseOptions;
    }

    const periodKeys = Object.keys(stateStats);
    const stateSet = new Set();

    periodKeys.forEach((periodKey) => {
      const periodData = stateStats?.[periodKey];
      if (periodData && typeof periodData === 'object') {
        Object.keys(periodData).forEach((state) => {
          if (state) {
            stateSet.add(state);
          }
        });
      }
    });

    return [...baseOptions, ...Array.from(stateSet).sort()];
  }, [stateStats]);

  const handleBulananClick = (event) => {
    setBulananAnchorEl(event.currentTarget);
  };

  const handleBulananClose = () => {
    setBulananAnchorEl(null);
  };

  const handleBulananChange = (value) => {
    setBulananFilter(value);
    handleBulananClose();
  };

  const handleProvinsiClick = (event) => {
    setProvinsiAnchorEl(event.currentTarget);
  };

  const handleProvinsiClose = () => {
    setProvinsiAnchorEl(null);
  };

  const handleProvinsiChange = (value) => {
    setProvinsiFilter(value);
    handleProvinsiClose();
  };

  const handleToggleFilters = () => {
    setFiltersOpen((prev) => {
      const next = !prev;
      if (!next) {
        setBulananAnchorEl(null);
        setProvinsiAnchorEl(null);
      }
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStateStats = async () => {
      try {
        if (isMounted) {
          setIsLoadingStats(true);
        }

        const currentUser = getSales();
        const salesInternalId = currentUser?.internal_id;

        if (!salesInternalId) {
          if (isMounted) {
            setStateStats(null);
            setTaskData(null);
            setIsLoadingStats(false);
          }
          return;
        }

        const query = new URLSearchParams({ sales_internal_id: salesInternalId }).toString();
        const response = await apiRequest(`dashboard/state-stats?${query}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch state stats (${response.status})`);
        }

        const payload = await response.json();
        const statsPayload = payload?.data;

        if (!statsPayload) {
          if (isMounted) {
            setStateStats(null);
            setTaskData(null);
            setIsLoadingStats(false);
          }
          return;
        }

        if (isMounted) {
          setStateStats(statsPayload);
          setIsLoadingStats(false);
        }
      } catch (err) {
        console.error('Error fetching state stats:', err);
        if (isMounted) {
          setStateStats(null);
          setTaskData(null);
          setIsLoadingStats(false);
        }
      }
    };

    fetchStateStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const filterKeyByLabel = {
      'Hari Ini': 'daily',
      'Mingguan': 'weekly',
      'Bulanan': 'monthly',
    };

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    if (!stateStats) {
      setTaskData(null);
      return;
    }

    const periodKey = filterKeyByLabel[bulananFilter] || 'monthly';
    const periodData = stateStats?.[periodKey];

    if (!periodData || typeof periodData !== 'object') {
      setTaskData(null);
      return;
    }

    const isAllStates = provinsiFilter === 'Semua Provinsi' || provinsiFilter === 'Provinsi';

    if (isAllStates) {
      const aggregated = Object.values(periodData).reduce(
        (acc, stateValue) => ({
          in_progress: acc.in_progress + toNumber(stateValue?.in_progress),
          missed: acc.missed + toNumber(stateValue?.missed),
          done: acc.done + toNumber(stateValue?.done),
        }),
        { in_progress: 0, missed: 0, done: 0 }
      );

      setTaskData({
        plan: aggregated.in_progress,
        missed: aggregated.missed,
        done: aggregated.done,
      });
      return;
    }

    const selectedStateData = periodData?.[provinsiFilter];
    if (!selectedStateData) {
      setTaskData(null);
      return;
    }

    setTaskData({
      plan: toNumber(selectedStateData.in_progress),
      missed: toNumber(selectedStateData.missed),
      done: toNumber(selectedStateData.done),
    });
  }, [stateStats, bulananFilter, provinsiFilter]);

  const total = useMemo(() => {
    if (!taskData) {
      return 0;
    }
    return taskData.plan + taskData.missed + taskData.done;
  }, [taskData]);

  const chartData = useMemo(() => {
    if (!taskData) {
      return [];
    }
    return [
      { id: 1, value: taskData.plan, label: 'Plan', color: '#6BA3D0' }, // Soft blue
      { id: 2, value: taskData.missed, label: 'Missed', color: '#F87171' }, // Soft red
      { id: 3, value: taskData.done, label: 'Done', color: '#34D399' }, // Soft green
    ].filter(item => item.value > 0);
  }, [taskData]);

  // Data used for rendering the chart; keep a fallback slice so the donut always shows
  const displayChartData = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return chartData.map(item => ({ id: item.id, value: item.value }));
    }
    // single neutral slice to keep donut shape
    return [{ id: 1, value: 1 }];
  }, [chartData]);

  // Colors used for the chart; muted when loading
  const displayColors = useMemo(() => {
    if (isLoadingStats) {
      if (chartData && chartData.length > 0) {
        return chartData.map(() => '#D1D5DB'); // muted gray
      }
      return ['#D1D5DB'];
    }
    return chartData.map(item => item.color);
  }, [chartData, isLoadingStats]);

  return (
    <Card
      elevation={0}
      sx={{
        background: '#FFFFFF',
        borderRadius: { xs: '16px', sm: '20px' },
        padding: { xs: '20px', sm: '24px' },
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
        border: 'none',
        mb: 3,
        mt: -1,
      }}
    >
      {/* Filter Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
            fontWeight: 700,
            color: '#6BA3D0',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            userSelect: 'none',
          }}
        >
          <DashboardIcon
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
              color: '#6BA3D0',
            }}
          />
          Dashboard
        </Typography>
        <Tooltip title={filtersOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'} arrow>
          <IconButton
            onClick={handleToggleFilters}
            aria-label="toggle filters"
            aria-expanded={filtersOpen}
            size="small"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              border: '1px solid rgba(17, 24, 39, 0.08)',
              backgroundColor: filtersOpen ? 'rgba(107, 163, 208, 0.12)' : '#FFFFFF',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                backgroundColor: filtersOpen ? 'rgba(107, 163, 208, 0.16)' : '#F9FAFB',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <FilterListIcon sx={{ color: '#6BA3D0' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={filtersOpen} timeout={180} unmountOnExit>
        {/* Filters */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: 1, sm: 1.5 },
            mb: 3,
            p: { xs: 1, sm: 1.25 },
            borderRadius: { xs: '14px', sm: '16px' },
            backgroundColor: '#F9FAFB',
            border: '1px solid rgba(17, 24, 39, 0.06)',
          }}
        >
          {/* Bulanan Filter */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                letterSpacing: '0.02em',
                px: 0.5,
              }}
            >
              Periode
            </Typography>
            <Button
              onClick={handleBulananClick}
              fullWidth
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: { xs: '10px 12px', sm: '12px 14px' },
                textTransform: 'none',
                color: '#374151',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                fontWeight: 500,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <CalendarTodayIcon
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    color: '#6BA3D0',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: '#111827',
                    minWidth: 0,
                  }}
                  title={bulananFilter}
                >
                  {bulananFilter}
                </Typography>
              </Box>
              <ExpandMoreIcon
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  color: '#6B7280',
                  transition: 'transform 0.2s ease-in-out',
                  transform: bulananAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
              />
            </Button>
          </Box>

          <Menu
            anchorEl={bulananAnchorEl}
            open={Boolean(bulananAnchorEl)}
            onClose={handleBulananClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: '12px',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                width: getMenuWidth(bulananAnchorEl),
              },
            }}
          >
            {bulananOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={() => handleBulananChange(option)}
                selected={option === bulananFilter}
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

          {/* Provinsi Filter */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                letterSpacing: '0.02em',
                px: 0.5,
              }}
            >
              Provinsi
            </Typography>
            <Button
              onClick={handleProvinsiClick}
              fullWidth
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: { xs: '10px 12px', sm: '12px 14px' },
                textTransform: 'none',
                color: '#374151',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                fontWeight: 500,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <LocationOnIcon
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    color: '#6BA3D0',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: '#111827',
                    minWidth: 0,
                  }}
                  title={provinsiFilter}
                >
                  {provinsiFilter}
                </Typography>
              </Box>
              <ExpandMoreIcon
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  color: '#6B7280',
                  transition: 'transform 0.2s ease-in-out',
                  transform: provinsiAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
              />
            </Button>
          </Box>

          <Menu
            anchorEl={provinsiAnchorEl}
            open={Boolean(provinsiAnchorEl)}
            onClose={handleProvinsiClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: '12px',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                width: getMenuWidth(provinsiAnchorEl),
              },
            }}
          >
            {provinsiOptions.map((option) => (
              <MenuItem
                key={option}
                onClick={() => handleProvinsiChange(option)}
                selected={option === provinsiFilter}
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
      </Collapse>

      {/* Donut Chart */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          mb: 3,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <PieChart
            series={[
              {
                data: displayChartData,
                innerRadius: 75,
                outerRadius: 105,
                paddingAngle: 3,
                cornerRadius: 10,
                cx: 120,
                cy: 120,
              },
            ]}
            width={240}
            height={240}
            slotProps={{
              legend: { hidden: true },
            }}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            colors={displayColors}
            style={{ opacity: isLoadingStats ? 0.45 : 1, pointerEvents: isLoadingStats ? 'none' : 'auto', transition: 'opacity 200ms ease' }}
          />

          {/* Spinner overlay when loading */}
          {isLoadingStats && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <CircularProgress size={48} sx={{ color: '#6BA3D0' }} />
            </Box>
          )}

          {/* Center Text */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 700,
                color: '#1F2937',
                lineHeight: 1.2,
                opacity: isLoadingStats ? 0.7 : 1,
              }}
            >
              {total > 0 ? total : (isLoadingStats ? '—' : 0)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                color: '#6B7280',
                fontWeight: 500,
                mt: 0.25,
                opacity: isLoadingStats ? 0.8 : 1,
              }}
            >
              Tasks
            </Typography>
          </Box>
        </Box>

        {/* Show No Data only when not loading and there is no data */}
        {!isLoadingStats && (total === 0 || chartData.length === 0) && (
          <Box
            sx={{
              position: 'absolute',
              width: 240,
              height: 240,
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

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 2, sm: 3 },
          flexWrap: 'wrap',
        }}
      >
        {chartData.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: item.color,
                flexShrink: 0,
                boxShadow: `0px 2px 6px ${alpha(item.color, 0.35)}`,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.25,
                  borderRadius: '999px',
                  backgroundColor: alpha(item.color, 0.12),
                  color: item.color,
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </Box>
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  color: '#111827',
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

