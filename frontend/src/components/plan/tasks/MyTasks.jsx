import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';
import { getSales } from '../../../utils/auth';

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
  const isMountedRef = useRef(true);
  const timeoutIdsRef = useRef(new Set());
  const { fetchPlansByDate, getPlansByDate, isLoading, getError, dataByDate, selectedFilter, setSelectedFilter } = useActivityPlans();

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current.clear();
  }, []);

  const runTimeout = useCallback((callback, delay) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current.delete(timeoutId);
      if (!isMountedRef.current) return;
      callback();
    }, delay);
    timeoutIdsRef.current.add(timeoutId);
    return timeoutId;
  }, []);
  
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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

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
      if (!isMountedRef.current) return;
      setIsAnimating(true);
      runTimeout(() => {
        setCurrentTime(new Date());
        runTimeout(() => {
          setIsAnimating(false);
        }, 800);
      }, 2400);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearAllTimeouts();
    };
  }, [clearAllTimeouts, runTimeout]);

  const day = String(currentTime.getDate()).padStart(2, '0');
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const year = currentTime.getFullYear();
  const dateString = `${day}-${month}-${year}`;
  
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
  const sharedCardShadow = 'rgba(10, 25, 47, 0.08)';

  const createCardTone = (baseRgb) => ({
    accent: `rgba(${baseRgb}, 0.16)`,
    labelColor: `rgba(${baseRgb}, 0.72)`,
    textColor: `rgba(${baseRgb}, 0.9)`,
    borderColor: `rgba(${baseRgb}, 0.12)`,
    selectedBorderColor: `rgba(${baseRgb}, 0.22)`,
    ringColor: `rgba(${baseRgb}, 0.12)`,
    orbColor: `rgba(${baseRgb}, 0.08)`,
    iconColor: `rgb(${baseRgb})`,
    shadowColor: sharedCardShadow,
    selectedBackground: `linear-gradient(145deg, rgba(255, 255, 255, 0.99) 0%, rgba(${baseRgb}, 0.16) 68%, rgba(255, 255, 255, 0.96) 100%)`,
    background: `linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(${baseRgb}, 0.09) 72%, rgba(255, 255, 255, 0.95) 100%)`,
  });

  const blueCardTone = createCardTone('31, 78, 140');
  const greenCardTone = createCardTone('74, 140, 114');
  const yellowCardTone = createCardTone('244, 169, 64');

  const taskCards = [
    {
      key: 'plan',
      label: 'Plan',
      value: stats.plan,
      ...blueCardTone,
    },
    {
      key: 'done',
      label: 'Done',
      value: stats.done,
      ...greenCardTone,
    },
    {
      key: 'more',
      label: 'To Do',
      value: stats.more,
      ...yellowCardTone,
    },
  ];

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
        {taskCards.map((card) => {
          const isSelected = selectedFilter === card.key;

          return (
            <Box
              key={card.key}
              onClick={() => setSelectedFilter(card.key)}
              sx={{
                background: isSelected ? card.selectedBackground : card.background,
                borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                padding: { xs: 2, sm: 2.5, md: 3 },
                minHeight: { xs: '88px', sm: '96px', md: '104px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
                border: isSelected ? `1px solid ${card.selectedBorderColor}` : `1px solid ${card.borderColor}`,
                boxShadow: isSelected
                  ? `0 10px 22px ${card.shadowColor}, 0 0 0 1px ${card.ringColor}, inset 0 0 0 1px rgba(255, 255, 255, 0.72)`
                  : `0 6px 16px ${card.shadowColor}`,
                cursor: 'pointer',
                transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 58%)',
                  opacity: isSelected ? 0.76 : 0.48,
                  transition: 'opacity 0.22s ease',
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  right: '-16%',
                  bottom: '-38%',
                  width: '74%',
                  height: '74%',
                  borderRadius: '50%',
                  background: card.orbColor,
                  pointerEvents: 'none',
                },
                '&:hover': {
                  transform: isSelected ? 'translateY(-3px)' : 'translateY(-2px)',
                  boxShadow: `0 10px 22px ${card.shadowColor}`,
                },
                '&:hover::before': {
                  opacity: isSelected ? 0.82 : 0.62,
                },
              }}
            >
              {isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.iconColor,
                    backgroundColor: 'rgba(255, 255, 255, 0.82)',
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.1)',
                    zIndex: 2,
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
                </Box>
              )}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: card.labelColor,
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9375rem' },
                    letterSpacing: '0.02em',
                    fontWeight: 600,
                    mb: 0.75,
                    textShadow: '0 1px 1px rgba(255, 255, 255, 0.22)',
                  }}
                >
                  {card.label}
                </Typography>
                {loading ? (
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={40}
                    sx={{
                      transform: 'none',
                      bgcolor: card.accent,
                      '&::after': {
                        background:
                          'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.62), transparent)',
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      color: card.textColor,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      fontWeight: 700,
                      lineHeight: 1,
                      textShadow: '0 1px 2px rgba(255, 255, 255, 0.22)',
                    }}
                  >
                    {card.value}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
}

