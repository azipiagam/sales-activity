import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import { getSales } from '../utils/auth';

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
  const { fetchPlansByDate, getPlansByDate, isLoading, getError, dataByDate, selectedFilter, setSelectedFilter } = useActivityPlans();
  
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

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const currentUser = getSales();
        const currentUserId = currentUser?.internal_id;

        if (!currentUserId) {
          if (isMounted) {
            setStats({ plan: 0, done: 0, more: 0 });
          }
          return;
        }

        let data = getPlansByDate(dateToUse);
        
        if (!data) {
          data = await fetchPlansByDate(dateToUse);
        }

        if (isMounted && data) {
          // Filter tasks berdasarkan user yang login dan status yang valid
          const allTasks = Array.isArray(data) 
            ? data.filter(task => {
                const normalizedStatus = (task.status || '').toLowerCase().trim();
                const isUserTask = task.sales_internal_id === currentUserId;
                const isValidStatus = normalizedStatus !== 'cancelled' && 
                                     normalizedStatus !== 'cancel' &&
                                     normalizedStatus !== 'deleted';
                return isUserTask && isValidStatus;
              })
            : [];

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

          setStats({ plan: 0, done: 0, more: 0 });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching stats:', err);

          setStats({ plan: 0, done: 0, more: 0 });
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [fetchPlansByDate, getPlansByDate, dateToUse]);

  useEffect(() => {
    // Get current logged in user
    const currentUser = getSales();
    const currentUserId = currentUser?.internal_id;

    if (!currentUserId) {
      setStats({ plan: 0, done: 0, more: 0 });
      return;
    }

    const data = getPlansByDate(dateToUse);
    if (data) {
      // Filter tasks berdasarkan user yang login dan status yang valid
      const allTasks = Array.isArray(data) 
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            const isUserTask = task.sales_internal_id === currentUserId;
            const isValidStatus = normalizedStatus !== 'cancelled' && 
                                 normalizedStatus !== 'cancel' &&
                                 normalizedStatus !== 'deleted';
            return isUserTask && isValidStatus;
          })
        : [];

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
      setStats({ plan: 0, done: 0, more: 0 });
    }
  }, [getPlansByDate, dateToUse, dataByDate]); 

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
        mt: -2,
        mb: 1,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
          mt: 4,
        }}
      >
        {/* In Progress Card */}
        <Box
          onClick={() => setSelectedFilter('plan')}
          sx={{
            backgroundColor: selectedFilter === 'plan' ? '#E3F2FD' : '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: selectedFilter === 'plan' 
              ? '0 4px 16px rgba(107, 163, 208, 0.3)' 
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: selectedFilter === 'plan' 
              ? '2px solid #6BA3D0' 
              : '1px solid rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: selectedFilter === 'plan' ? '#E3F2FD' : '#F5F5F5',
              boxShadow: '0 4px 16px rgba(107, 163, 208, 0.2)',
            },
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
            <Skeleton
              variant="text"
              width="60%"
              height={40}
              sx={{ transform: 'none' }}
            />
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
          onClick={() => setSelectedFilter('done')}
          sx={{
            backgroundColor: selectedFilter === 'done' ? '#E3F2FD' : '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: selectedFilter === 'done' 
              ? '0 4px 16px rgba(107, 163, 208, 0.3)' 
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: selectedFilter === 'done' 
              ? '2px solid #6BA3D0' 
              : '1px solid rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: selectedFilter === 'done' ? '#E3F2FD' : '#F5F5F5',
              boxShadow: '0 4px 16px rgba(107, 163, 208, 0.2)',
            },
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
            <Skeleton
              variant="text"
              width="60%"
              height={40}
              sx={{ transform: 'none' }}
            />
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
          onClick={() => setSelectedFilter('more')}
          sx={{
            backgroundColor: selectedFilter === 'more' ? '#E3F2FD' : '#FFFFFF',
            borderRadius: { xs: '12px', sm: '14px', md: '16px' },
            padding: { xs: 2, sm: 2.5, md: 3 },
            minHeight: { xs: '100px', sm: '110px', md: '120px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: selectedFilter === 'more' 
              ? '0 4px 16px rgba(107, 163, 208, 0.3)' 
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: selectedFilter === 'more' 
              ? '2px solid #6BA3D0' 
              : '1px solid rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: selectedFilter === 'more' ? '#E3F2FD' : '#F5F5F5',
              boxShadow: '0 4px 16px rgba(107, 163, 208, 0.2)',
            },
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
            To Do
          </Typography>
          {loading ? (
            <Skeleton
              variant="text"
              width="60%"
              height={40}
              sx={{ transform: 'none' }}
            />
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

