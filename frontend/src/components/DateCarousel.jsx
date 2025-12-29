import React, { useState, useRef, useEffect } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function DateCarousel({ selectedDate: propSelectedDate, onDateChange }) {
  const theme = useTheme();
  const primaryColor = '#6BA3D0'; 
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const getDates = () => {
    const dates = [];
    const baseDate = selectedDate || new Date();
    
    const dayOfWeek = baseDate.getDay();
    
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - daysToMonday);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
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
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  return (
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 0,
          mt: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: { xs: '12px', sm: '14px', md: '16px' },
          px: { xs: 1, sm: 1.5 },
          py: 1,
        }}
      >
        {/* Left Arrow */}
        <IconButton
          onClick={scrollLeft}
          sx={{
            color: primaryColor,
            backgroundColor: '#FFFFFF',
            '&:hover': {
              backgroundColor: alpha(primaryColor, 0.1),
            },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Calendar Row */}
        <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            width: '100%',
            maxWidth: 'fit-content',
            overflowX: 'hidden',
            overflowY: 'hidden',
            backgroundColor: '#FFFFFF',
            py: 0.5,
          }}
        >
        {dates.map((date, index) => {
          const { day, dayName } = formatDate(date);
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <Paper
              key={index}
              onClick={() => handleDateClick(date)}
              sx={{
                minWidth: { xs: '42px', sm: '46px', md: '50px' },
                width: { xs: '42px', sm: '46px', md: '50px' },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: { xs: '6px 3px', sm: '8px 4px', md: '10px 5px' },
                cursor: 'pointer',
                backgroundColor: selected ? primaryColor : '#FFFFFF',
                color: selected ? 'white' : primaryColor,
                borderRadius: { xs: '8px', sm: '10px', md: '12px' },
                boxShadow: selected
                  ? `0 2px 8px ${alpha(primaryColor, 0.4)}`
                  : '0 1px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                border: today && !selected ? `1.5px solid ${primaryColor}` : 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  backgroundColor: selected ? primaryColor : alpha(primaryColor, 0.1),
                  boxShadow: selected
                    ? `0 4px 12px ${alpha(primaryColor, 0.5)}`
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
                  color: selected ? 'white' : primaryColor,
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
                  color: selected ? 'white' : primaryColor,
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
          onClick={scrollRight}
          sx={{
            color: primaryColor,
            backgroundColor: '#FFFFFF',
            '&:hover': {
              backgroundColor: alpha(primaryColor, 0.1),
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Paper>
  );
}

