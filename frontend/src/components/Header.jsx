import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { motion } from 'framer-motion';
import DateCarousel from './DateCarousel';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { logout, getSales } from '../utils/auth';

export default function Header({ 
  calendarAnchorEl, 
  onCalendarClick, 
  onCalendarClose, 
  pickerDate, 
  onPickerDateChange,
  selectedDate,
  onDateChange
}) {
  const navigate = useNavigate();
  const [logoutMenuAnchorEl, setLogoutMenuAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isLogoutMenuOpen = Boolean(logoutMenuAnchorEl);
  
  const sales = getSales();
  const salesName = (sales && sales.name) ? sales.name : 'Sales';
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutMenuClick = (event) => {
    setLogoutMenuAnchorEl(event.currentTarget);
  };

  const handleLogoutMenuClose = () => {
    setLogoutMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleLogoutMenuClose();
    logout();
    navigate('/login');
  };

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
            minHeight: { xs: '90px', sm: '100px', md: '110px' },
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
          {/* LEFT SIDE - Logo and Greeting */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.25, sm: 1.5, md: 1.75 },
              }}
            >
              {/* Logo/Icon */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 44, sm: 48, md: 52 },
                  height: { xs: 44, sm: 48, md: 52 },
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }}
              >
                <BusinessCenterIcon
                  sx={{
                    color: 'white',
                    fontSize: { xs: '24px', sm: '26px', md: '28px' },
                  }}
                />
              </Box>
              
              {/* Greeting and User Info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.2,
                  }}
                >
                  {getGreeting()}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: { xs: '0.80rem', sm: '0.90rem', md: '1.0rem' },
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1.2,
                    }}
                  >
                    {salesName}
                  </Typography>
                  <Box
                    onClick={handleLogoutMenuClick}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        color: 'white',
                        fontSize: { xs: '16px', sm: '18px', md: '20px' },
                        transition: 'transform 0.2s ease',
                        transform: isLogoutMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* RIGHT SIDE - Time and Calendar Icon */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            {/* Current Time */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 0.75,
                px: { sm: 1.5, md: 2 },
                py: 0.75,
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <AccessTimeIcon
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { sm: '16px', md: '18px' },
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: { sm: '0.75rem', md: '0.8rem' },
                  fontWeight: 500,
                  color: 'white',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {format(currentTime, 'HH:mm')}
              </Typography>
            </Box>

            {/* Calendar Icon Button */}
            <IconButton
              onClick={onCalendarClick}
              sx={{
                width: { xs: 40, sm: 44, md: 48 },
                height: { xs: 40, sm: 44, md: 48 },
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <CalendarTodayIcon
                sx={{
                  color: 'white',
                  fontSize: { xs: '20px', sm: '22px', md: '24px' },
                }}
              />
            </IconButton>
          </Box>
        </Box>
        
        {/* Divider */}
        <Divider
          sx={{
            borderColor: 'rgba(255,255,255,0.15)',
            mx: { xs: 2.5, sm: 3 },
            opacity: 0.6,
          }}
        />

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
          <DateCarousel selectedDate={selectedDate} onDateChange={onDateChange} />
        </Box>
      </Box>

      {/* LOGOUT MENU DROPDOWN */}
      <Menu
        anchorEl={logoutMenuAnchorEl}
        open={isLogoutMenuOpen}
        onClose={handleLogoutMenuClose}
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
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          },
        }}
        MenuListProps={{
          sx: {
            py: 0.5,
          },
        }}
      >
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(107, 163, 208, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'text.primary',
            }}
          />
        </MenuItem>
      </Menu>

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

