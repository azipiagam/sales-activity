import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import LoadingScreen from './LoadingScreen';

export default function CardPlan({ selectedDate }) {
  const [stats, setStats] = useState({ plan: 0, done: 0, more: 0 });
  const { fetchPlansByDate, getPlansByDate, isLoading, getError, dataByDate, selectedFilter, setSelectedFilter } = useActivityPlans();
  
  const dateToUse = useMemo(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [selectedDate]);

  const dateStr = format(dateToUse, 'yyyy-MM-dd');
  const loading = isLoading(`date:${dateStr}`);
  const error = getError(`date:${dateStr}`);

  // Show loading screen when loading
  if (loading) {
    return <LoadingScreen />;
  }

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        let data = getPlansByDate(dateToUse);
        
        if (!data) {
          data = await fetchPlansByDate(dateToUse);
        }

        if (isMounted && data) {
          const allTasks = Array.isArray(data) 
            ? data.filter(task => {
                const normalizedStatus = (task.status || '').toLowerCase().trim();
                return normalizedStatus !== 'cancelled' && 
                       normalizedStatus !== 'cancel' &&
                       normalizedStatus !== 'deleted';
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

          console.log(`[CardPlan] Date: ${dateStr}, Stats:`, { 
            plan, done, more, 
            inProgress, rescheduled, 
            totalTasks: allTasks.length 
          });

          setStats({ plan, done, more });
        } else if (isMounted) {
          console.log(`[CardPlan] No data for date: ${dateStr}`);
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
  }, [fetchPlansByDate, getPlansByDate, dateToUse, dateStr]);

  useEffect(() => {
    const data = getPlansByDate(dateToUse);
    if (data) {
      const allTasks = Array.isArray(data) 
        ? data.filter(task => {
            const normalizedStatus = (task.status || '').toLowerCase().trim();
            return normalizedStatus !== 'cancelled' && 
                   normalizedStatus !== 'cancel' &&
                   normalizedStatus !== 'deleted';
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

      console.log(`[CardPlan] Data updated for ${dateStr}:`, { 
        plan, done, more, 
        inProgress, rescheduled, 
        totalTasks: allTasks.length 
      });

      setStats({ plan, done, more });
    } else {
      setStats({ plan: 0, done: 0, more: 0 });
    }
  }, [getPlansByDate, dateToUse, dateStr, dataByDate]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        mt: { xs: -7, sm: -8, md: -9 },
        mb: { xs: 3, sm: 4, md: 5 },
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: { xs: 1.5, sm: 2, md: 2.5 },
          width: '100%',
          maxWidth: { xs: '100%', sm: '500px', md: '550px' },
          justifyContent: 'center',
        }}
      >
        {/* Card Plan */}
        <Box
          onClick={() => setSelectedFilter('plan')}
          sx={{
            flex: 1,
            backgroundColor: selectedFilter === 'plan' ? 'rgba(107, 163, 208, 0.08)' : 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: selectedFilter === 'plan' 
              ? '2px solid #4e8ec2' 
              : '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderBottom: '2px solid #4e8ec2',
              backgroundColor: selectedFilter === 'plan' 
                ? 'rgba(107, 163, 208, 0.12)' 
                : 'rgba(107, 163, 208, 0.05)',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EventNoteIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#6BA3D0',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            Plan
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#6BA3D0',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            {stats.plan}
          </Typography>
        </Box>

        {/* Card Done */}
        <Box
          onClick={() => setSelectedFilter('done')}
          sx={{
            flex: 1,
            backgroundColor: selectedFilter === 'done' ? 'rgba(90, 155, 200, 0.08)' : 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: selectedFilter === 'done' 
              ? '2px solid #5A9BC8' 
              : '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderBottom: '2px solid #5A9BC8',
              backgroundColor: selectedFilter === 'done' 
                ? 'rgba(90, 155, 200, 0.12)' 
                : 'rgba(90, 155, 200, 0.05)',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#5A9BC8',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            Done
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#5A9BC8',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            {stats.done}
          </Typography>
        </Box>

        {/* Card More */}
        <Box
          onClick={() => setSelectedFilter('more')}
          sx={{
            flex: 1,
            backgroundColor: selectedFilter === 'more' ? 'rgba(74, 139, 192, 0.08)' : 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: selectedFilter === 'more' 
              ? '2px solid #4A8BC0' 
              : '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderBottom: '2px solid #4A8BC0',
              backgroundColor: selectedFilter === 'more' 
                ? 'rgba(74, 139, 192, 0.12)' 
                : 'rgba(74, 139, 192, 0.05)',
            },
          }}
        >
          {/* Icon Background */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, sm: 12, md: 14 },
              right: { xs: 10, sm: 12, md: 14 },
              width: { xs: '28px', sm: '32px', md: '36px' },
              height: { xs: '28px', sm: '32px', md: '36px' },
              borderRadius: '50%',
              backgroundColor: 'rgba(107, 163, 208, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizIcon
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                color: '#4A8BC0',
              }}
            />
          </Box>
          
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#333',
              textAlign: 'left',
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              mb: { xs: 0.75, sm: 1, md: 1.25 },
              width: '100%',
              lineHeight: 1.2,
            }}
          >
            More
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              fontWeight: 700,
              color: '#4A8BC0',
              textAlign: 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              width: '100%',
              lineHeight: 1,
            }}
          >
            {stats.more}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

