import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

const fadeOut = keyframes`
  from {
    opacity: 2;
  }
  to {
    opacity: 0.6;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0.6;
  }
  to {
    opacity: 2;
  }
`;

export default function MyTasks({ selectedDate }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [stats, setStats] = useState({ plan: 0, done: 0, more: 0 });
  const { fetchPlansByDate, getPlansByDate, isLoading, getError, dataByDate } = useActivityPlans();
  
  // Use selectedDate if provided, otherwise use today
  const dateToUse = useMemo(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);
  
  const dateStr = format(dateToUse, 'yyyy-MM-dd');
  const loading = isLoading(`date:${dateStr}`);
  const error = getError(`date:${dateStr}`);

  // Fetch statistics using shared context
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        // Try to get from cache first
        let data = getPlansByDate(dateToUse);
        
        // If not in cache, fetch it
        if (!data) {
          data = await fetchPlansByDate(dateToUse);
        }

        if (isMounted && data) {
          // Filter out cancelled/deleted status
          const allTasks = Array.isArray(data) 
            ? data.filter(task => {
                const normalizedStatus = (task.status || '').toLowerCase().trim();
                return normalizedStatus !== 'cancelled' && 
                       normalizedStatus !== 'cancel' &&
                       normalizedStatus !== 'deleted';
              })
            : [];

          // Calculate stats according to requirements:
          // Plan = done + in progress + rescheduled (all except cancelled)
          // Done = done only
          // More to go = in progress + rescheduled only (without done)
          const inProgress = allTasks.filter(t => {
            const status = (t.status || '').toLowerCase().trim();
            return status === 'in progress';
          }).length;
          
          const rescheduled = allTasks.filter(t => {
            const status = (t.status || '').toLowerCase().trim();
            return status === 'rescheduled';
          }).length;
          
          const done = allTasks.filter(t => {
            const status = (t.status || '').toLowerCase().trim();
            return status === 'done';
          }).length;

          const plan = done + inProgress + rescheduled;
          const more = inProgress + rescheduled;

          setStats({ plan, done, more });
        } else if (isMounted) {
          // No data for this date
          setStats({ plan: 0, done: 0, more: 0 });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching stats:', err);
          // Set default values on error
          setStats({ plan: 0, done: 0, more: 0 });
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [fetchPlansByDate, getPlansByDate, dateToUse]);

  // Update stats when data changes - trigger ketika dataByDate berubah
  useEffect(() => {
    const data = getPlansByDate(dateToUse);
    if (data) {
      // Filter out cancelled/deleted status
      const allTasks = Array.isArray(data) 
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            return normalizedStatus !== 'cancelled' && 
                   normalizedStatus !== 'cancel' &&
                   normalizedStatus !== 'deleted';
          })
        : [];

      // Calculate stats according to requirements:
      // Plan = done + in progress + rescheduled (all except cancelled)
      // Done = done only
      // More to go = in progress + rescheduled only (without done)
      const inProgress = allTasks.filter(t => {
        const status = (t.status || '').toLowerCase().trim();
        return status === 'in progress';
      }).length;
      
      const rescheduled = allTasks.filter(t => {
        const status = (t.status || '').toLowerCase().trim();
        return status === 'rescheduled';
      }).length;
      
      const done = allTasks.filter(t => {
        const status = (t.status || '').toLowerCase().trim();
        return status === 'done';
      }).length;

      const plan = done + inProgress + rescheduled;
      const more = inProgress + rescheduled;

      setStats({ plan, done, more });
    } else {
      // No data for this date
      setStats({ plan: 0, done: 0, more: 0 });
    }
  }, [getPlansByDate, dateToUse, dataByDate]); // Tambah dataByDate sebagai dependency

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTime(new Date());
        setTimeout(() => {
          setIsAnimating(false);
        }, 800);
      }, 2400);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const day = String(currentTime.getDate()).padStart(2, '0');
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const year = currentTime.getFullYear();
  const dateString = `${day}-${month}-${year}`;
  
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        mt: 0,
        mb: 1,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: { xs: 4.1, sm: 4, md: 4.5 },
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
            fontWeight: 700,
            color: '#333',
          }}
        >
          My Activity Plan
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: `${fadeIn} 1.2s ease-out`,
          }}
        >
          <AccessTimeIcon
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: '#81c784', // Light green color
              animation: isAnimating 
                ? `${fadeOut} 1.2s ease-in-out forwards` 
                : `${fadeIn} 1.2s ease-in-out forwards`,
              alignSelf: 'center',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              color: '#999', // Light grey color
              animation: isAnimating 
                ? `${fadeOut} 1.2s ease-in-out forwards` 
                : `${fadeIn} 1.2s ease-in-out forwards`,
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            {dateString} {timeString}
          </Typography>
        </Box>
      </Box>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {/* In Progress Card */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            Plan
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#6BA3D0' }} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                color: '#6BA3D0',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {stats.plan}
            </Typography>
          )}
        </Box>

        {/* Task Completed Card */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            Done
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#6BA3D0' }} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                color: '#6BA3D0',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {stats.done}
            </Typography>
          )}
        </Box>

        {/* On Review Card */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
              fontWeight: 500,
              mb: 1,
            }}
          >
            More To Go
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#6BA3D0' }} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                color: '#6BA3D0',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {stats.more}
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

