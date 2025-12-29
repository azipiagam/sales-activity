import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CircularProgress from '@mui/material/CircularProgress';
import { format } from 'date-fns';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

export default function CardPlan({ selectedDate }) {
  const [stats, setStats] = useState({ plan: 0, done: 0, more: 0 });
  const { fetchPlansByDate, getPlansByDate, isLoading, getError, dataByDate } = useActivityPlans();
  
  // Memoize dateToUse to ensure it updates when selectedDate changes
  const dateToUse = useMemo(() => {
    if (selectedDate) {
      // Create a new date object from selectedDate to ensure it's a proper Date object
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

  // Fetch and calculate stats based on selected date
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

          console.log(`[CardPlan] Date: ${dateStr}, Stats:`, { 
            plan, done, more, 
            inProgress, rescheduled, 
            totalTasks: allTasks.length 
          });

          setStats({ plan, done, more });
        } else if (isMounted) {
          // No data for this date
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

  // Update stats when data changes (for the selected date)
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

      console.log(`[CardPlan] Data updated for ${dateStr}:`, { 
        plan, done, more, 
        inProgress, rescheduled, 
        totalTasks: allTasks.length 
      });

      setStats({ plan, done, more });
    } else {
      // No data for this date, reset stats
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
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #6BA3D0',
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
          {loading ? (
            <CircularProgress 
              size={20} 
              sx={{ 
                color: '#6BA3D0',
                mt: 0.5
              }} 
            />
          ) : (
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
          )}
        </Box>

        {/* Card Done */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #5A9BC8',
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
          {loading ? (
            <CircularProgress 
              size={20} 
              sx={{ 
                color: '#5A9BC8',
                mt: 0.5
              }} 
            />
          ) : (
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
          )}
        </Box>

        {/* Card More */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            minHeight: { xs: '70px', sm: '80px', md: '90px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(107, 163, 208, 0.2)',
            transition: 'border-bottom 0.2s ease',
            '&:hover': {
              borderBottom: '1px solid #4A8BC0',
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
          {loading ? (
            <CircularProgress 
              size={20} 
              sx={{ 
                color: '#4A8BC0',
                mt: 0.5
              }} 
            />
          ) : (
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
          )}
        </Box>
      </Box>
    </Box>
  );
}

