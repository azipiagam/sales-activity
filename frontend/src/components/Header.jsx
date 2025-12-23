import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { motion } from 'framer-motion';
import DateCarousel from './DateCarousel';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { id } from 'date-fns/locale';
import { logout, getSales } from '../utils/auth';

export default function Header({ 
  calendarAnchorEl, 
  onCalendarClick, 
  onCalendarClose, 
  pickerDate, 
  onPickerDateChange 
}) {
  const navigate = useNavigate();
  
  // Get sales name directly from localStorage every render to ensure latest data
  const sales = getSales();
  const salesName = (sales && sales.name) ? sales.name : 'Sales';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Pattern SVG untuk background header (sama dengan login page)
  const patternSvg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geometric-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2" fill="rgba(255,255,255,0.08)"/>
          <rect x="15" y="5" width="8" height="8" fill="rgba(255,255,255,0.06)" rx="1"/>
          <path d="M 30 5 L 35 10 L 30 10 Z" fill="rgba(255,255,255,0.07)"/>
          <circle cx="25" cy="25" r="3" fill="rgba(255,255,255,0.05)"/>
          <rect x="5" y="20" width="6" height="6" fill="rgba(255,255,255,0.06)" rx="1"/>
          <path d="M 20 30 L 25 35 L 20 35 Z" fill="rgba(255,255,255,0.07)"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#geometric-pattern)"/>
    </svg>
  `;

  return (
    <>
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'primary.main',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
          borderBottomLeftRadius: { xs: '28px', sm: '32px', md: '36px' },
          borderBottomRightRadius: { xs: '28px', sm: '32px', md: '36px' },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`,
            backgroundRepeat: 'repeat',
            opacity: 0.4,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: '80px', sm: '90px', md: '100px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            backgroundColor: 'primary.main',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0,
            },
          }}
        >
          {/* HELLO SALES */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ zIndex: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {salesName}!
              </Typography>

              <motion.div
                animate={{ rotate: [0, 20, -20, 20, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <WavingHandIcon sx={{ color: 'white' }} />
              </motion.div>
            </Box>
          </motion.div>

          {/* CALENDAR AND LOGOUT BUTTONS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
            {/* CALENDAR BUTTON */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                onClick={onCalendarClick}
                sx={{
                  width: { xs: 40, sm: 44, md: 48 },
                  height: { xs: 40, sm: 44, md: 48 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: { xs: '10px', sm: '12px', md: '14px' },
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  },
                }}
              >
                <CalendarTodayIcon sx={{ color: 'white' }} />
              </Paper>
            </motion.div>

            {/* LOGOUT BUTTON */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Paper
                onClick={handleLogout}
                sx={{
                  width: { xs: 40, sm: 44, md: 48 },
                  height: { xs: 40, sm: 44, md: 48 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: { xs: '10px', sm: '12px', md: '14px' },
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  },
                }}
              >
                <LogoutIcon sx={{ color: 'white' }} />
              </Paper>
            </motion.div>
          </Box>
        </Box>

        {/* DATE CAROUSEL */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.25 },
            backgroundColor: 'primary.main',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(patternSvg)}")`,
              backgroundRepeat: 'repeat',
              opacity: 0.4,
              pointerEvents: 'none',
              zIndex: 0,
            },
          }}
        >
          <DateCarousel />
        </Box>
      </Box>

      {/* DATE PICKER */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
        <Popover
          open={Boolean(calendarAnchorEl)}
          anchorEl={calendarAnchorEl}
          onClose={onCalendarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 2 }}>
            <DatePicker
              value={pickerDate}
              onChange={onPickerDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 250 },
                },
              }}
            />
          </Box>
        </Popover>
      </LocalizationProvider>
    </>
  );
}

