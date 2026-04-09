import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';
import { format } from 'date-fns';

export default function DateCarousel({
  selectedDate: propSelectedDate,
  onDateChange,
  onLoadingChange,
  height,
}) {
  const textOnLightAccent = 'var(--text-on-light-accent)';
  const textOnBluePrimary = 'var(--text-on-blue-primary)';
  const selectedDateText = 'var(--theme-blue-overlay)';
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date());
  const [isLoading, setIsLoading] = useState(false);
  const userClickTimeRef = useRef(0);
  const { isLoading: checkDataLoading } = useActivityPlans();
  
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
  
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
  };

  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => {
    return getMondayOfWeek(propSelectedDate || new Date());
  });

  useEffect(() => {
    const timeSinceUserClick = Date.now() - userClickTimeRef.current;
    if (propSelectedDate && timeSinceUserClick > 500) {
      const propDate = new Date(propSelectedDate);
      propDate.setHours(0, 0, 0, 0);
      
      setSelectedDate(prevSelectedDate => {
        const prevDate = new Date(prevSelectedDate);
        prevDate.setHours(0, 0, 0, 0);
        
        if (propDate.getTime() !== prevDate.getTime()) {
          const newSelectedDate = new Date(propSelectedDate);
          setCurrentWeekMonday(getMondayOfWeek(newSelectedDate));
          return newSelectedDate;
        }
        return prevSelectedDate;
      });
    }
  }, [propSelectedDate]);

  const getDates = () => {
    const dates = [];
    
    const mondayTime = currentWeekMonday.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(mondayTime + (i * oneDayInMs));
      dates.push(date);
    }
    
    return dates;
  };

  const dates = getDates();

  const formatDate = (date) => {
    const day = date.getDate();
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
    return { day, dayName };
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    
    const date1 = new Date(date);
    date1.setHours(0, 0, 0, 0);
    const date2 = new Date(selectedDate);
    date2.setHours(0, 0, 0, 0);
    
    return date1.getTime() === date2.getTime();
  };

  const handleDateClick = (date) => {
    if (isLoading) return;

    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    
    const currentSelectedDate = new Date(selectedDate);
    currentSelectedDate.setHours(0, 0, 0, 0);
    
    if (clickedDate.getTime() !== currentSelectedDate.getTime()) {
      setIsLoading(true);
      if (onLoadingChange) {
        onLoadingChange(true);
      }
      
      const dateStr = format(clickedDate, 'yyyy-MM-dd');
      const cacheKey = `date:${dateStr}`;
      
      userClickTimeRef.current = Date.now();
      
      setSelectedDate(clickedDate);
      setCurrentWeekMonday(getMondayOfWeek(clickedDate));
      
      if (onDateChange) {
        onDateChange(new Date(clickedDate));
      }
      
      let checkCount = 0;
      const maxChecks = 50; 
      
      const checkLoading = () => {
        checkCount++;
        const dataLoading = checkDataLoading(cacheKey);
        
        if (!dataLoading || checkCount >= maxChecks) {
          setIsLoading(false);
          if (onLoadingChange) {
            onLoadingChange(false);
          }
        } else {
          setTimeout(checkLoading, 200);
        }
      };
      
      setTimeout(() => {
        checkLoading();
      }, 300);
    } else {
      userClickTimeRef.current = Date.now();
      setSelectedDate(clickedDate);
      setCurrentWeekMonday(getMondayOfWeek(clickedDate));
      
      if (onDateChange) {
        onDateChange(new Date(clickedDate));
      }
    }
  };

  const handlePreviousWeek = () => {
    if (isLoading) return;

    setIsLoading(true);
    if (onLoadingChange) {
      onLoadingChange(true);
    }
    

    const mondayTime = currentWeekMonday.getTime();
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
    const previousMonday = new Date(mondayTime - fiveDaysInMs);
    
    setTimeout(() => {
      setCurrentWeekMonday(previousMonday);
      
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }, 600);
    }, 50);
  };

  const handleNextWeek = () => {
    if (isLoading) return;

    setIsLoading(true);
    if (onLoadingChange) {
      onLoadingChange(true);
    }
    
    const mondayTime = currentWeekMonday.getTime();
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
    const nextMonday = new Date(mondayTime + fiveDaysInMs);
    
    setTimeout(() => {
      setCurrentWeekMonday(nextMonday);
      
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }, 600);
    }, 50);
  };

  return (
    <Paper
        elevation={0}
        sx={{
          width: '100%',
          ...(height ? { height } : {}),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0.5, sm: 1 },
          mb: 0,
          mt: 0,
          backgroundColor: 'transparent',
          borderRadius: { xs: '12px', sm: '14px', md: '16px' },
          px: { xs: 0.5, sm: 1, md: 1.5 },
          py: 1,
          overflow: 'visible',
          boxShadow: 'none',
          opacity: isLoading ? 0.65 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
        }}
      >
        {/* Left Arrow */}
        <IconButton
          onClick={handlePreviousWeek}
          disabled={isLoading}
          sx={{
            color: textOnBluePrimary,
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 1,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderColor: 'rgba(255,255,255,0.3)',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Calendar Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            py: 0.5,
            minWidth: 0, 
          }}
        >
        {dates.map((date, index) => {
          const { day, dayName } = formatDate(date);
          const today = isToday(date);
          const selected = isSelected(date);
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

          return (
            <Paper
              key={dateKey}
              onClick={() => handleDateClick(date)}
              sx={{
                minWidth: { xs: '40px', sm: '44px', md: '48px' },
                width: { xs: '40px', sm: '44px', md: '48px' },
                flexShrink: 0,
                flexGrow: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: { xs: '6px 2px', sm: '8px 3px', md: '10px 4px' },
                cursor: 'pointer',
                background: selected
                  ? 'linear-gradient(145deg, var(--theme-accent-primary), var(--theme-accent-highlight))'
                  : 'rgba(255,255,255,0.15)',
                color: textOnBluePrimary,
                borderRadius: { xs: '8px', sm: '10px', md: '12px' },
                border: selected
                  ? '1.5px solid rgba(255, 255, 255, 0.55)'
                  : '1.5px solid rgba(255,255,255,0.2)',
                backdropFilter: selected ? 'none' : 'blur(10px)',
                boxShadow: selected
                  ? '0 5px 14px rgba(244, 169, 64, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                  : '0 1px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                outline: today && !selected ? `1.5px solid ${textOnLightAccent}` : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: selected
                    ? 'linear-gradient(145deg, var(--theme-accent-highlight), var(--theme-accent-primary))'
                    : 'rgba(255,255,255,0.25)',
                  borderColor: selected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255,255,255,0.3)',
                  boxShadow: selected
                    ? '0 8px 18px rgba(244, 169, 64, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.25)'
                    : '0 3px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                  fontWeight: 600,
                  mb: { xs: 0.15, sm: 0.25 },
                  color: selected ? selectedDateText : textOnBluePrimary,
                  lineHeight: 1.1,
                }}
              >
                {dayName}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.05rem' },
                  fontWeight: 700,
                  color: selected ? selectedDateText : textOnBluePrimary,
                  lineHeight: 1.1,
                }}
              >
                {day}
              </Typography>
            </Paper>
          );
        })}
        </Box>

        {/* Right Arrow */}
        <IconButton
          onClick={handleNextWeek}
          disabled={isLoading}
          sx={{
            color: textOnBluePrimary,
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 1,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderColor: 'rgba(255,255,255,0.3)',
            },
            '&:disabled': {
              opacity: 0.5,
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Paper>
  );
}

