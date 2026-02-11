import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion } from 'framer-motion';
import DateCarousel from './DateCarousel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { logout, getSales } from '../utils/auth';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import backgroundHeader from '../media/bgh1.svg';

export default function Header({
  calendarAnchorEl,
  onCalendarClick,
  onCalendarClose,
  pickerDate,
  onPickerDateChange,
  selectedDate,
  onDateChange,
  onDateCarouselLoadingChange,
  onRefresh,
  dashboardPeriod,
  onDashboardPeriodChange,
  dashboardProvince,
  onDashboardProvinceChange,
  dashboardProvinceOptions,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutMenuAnchorEl, setLogoutMenuAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isLogoutMenuOpen = Boolean(logoutMenuAnchorEl);
  const [periodAnchorEl, setPeriodAnchorEl] = useState(null);
  const [provinceAnchorEl, setProvinceAnchorEl] = useState(null);

  const { invalidateCache, fetchAllPlans, fetchPlansByDate } = useActivityPlans();

  const sales = getSales();
  const salesName = (sales && sales.name) ? sales.name : 'Sales';

  const isPlanPage = location.pathname === '/plan';
  const isDashboardPage = location.pathname === '/';

  const periodValue = dashboardPeriod || 'Bulan ini';
  const provinceValue = dashboardProvince || 'Semua Provinsi';
  const periodOptions = ['Hari Ini', '7 Hari Terakhir', 'Bulan ini'];
  const provinceOptions = Array.isArray(dashboardProvinceOptions) && dashboardProvinceOptions.length > 0
    ? dashboardProvinceOptions
    : ['Semua Provinsi'];

  const bottomControlHeight = { xs: 64, sm: 70, md: 74 };
  
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
    if (event && event.currentTarget) {
      setLogoutMenuAnchorEl(event.currentTarget);
    }
  };

  const handleLogoutMenuClose = () => {
    setLogoutMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleLogoutMenuClose();
    logout();
    navigate('/login');
  };

  const handlePeriodClick = (event) => {
    if (event?.currentTarget) setPeriodAnchorEl(event.currentTarget);
  };

  const handlePeriodClose = () => {
    setPeriodAnchorEl(null);
  };

  const handlePeriodChange = (value) => {
    if (typeof onDashboardPeriodChange === 'function') {
      onDashboardPeriodChange(value);
    }
    handlePeriodClose();
  };

  const handleProvinceClick = (event) => {
    if (event?.currentTarget) setProvinceAnchorEl(event.currentTarget);
  };

  const handleProvinceClose = () => {
    setProvinceAnchorEl(null);
  };

  const handleProvinceChange = (value) => {
    if (typeof onDashboardProvinceChange === 'function') {
      onDashboardProvinceChange(value);
    }
    handleProvinceClose(); 
  };

  const handleReset = async () => {
    try {
      if (typeof onRefresh === 'function') {
        onRefresh();
      }

      invalidateCache();

      await fetchAllPlans(true, true);

      await fetchPlansByDate(selectedDate, true, true);

      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

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
            backgroundImage: `url(${backgroundHeader})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.08) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: '70px', sm: '75px', md: '80px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
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

            {/* Reset Icon Button */}
            <IconButton
              onClick={handleReset}
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
              <RefreshIcon
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

        {/* BOTTOM AREA: DateCarousel (Plan) / Filters (Dashboard) */}
        {(isPlanPage || isDashboardPage) && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${backgroundHeader})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 0,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {isPlanPage ? (
                <DateCarousel
                  selectedDate={selectedDate}
                  onDateChange={onDateChange}
                  onLoadingChange={onDateCarouselLoadingChange}
                  height={bottomControlHeight}
                />
              ) : (
                <Paper
                  elevation={2}
                  sx={{
                    width: '100%',
                    height: bottomControlHeight,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 0.75, sm: 1 },
                    backgroundColor: '#FFFFFF',
                    borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                    px: { xs: 0.75, sm: 1, md: 1.5 },
                    py: 1,
                    overflow: 'visible',
                  }}
                >
                  <Button
                    onClick={handlePeriodClick}
                    variant="contained"
                    disableElevation
                    startIcon={<AccessTimeIcon />}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transition: 'transform 200ms ease',
                          transform: periodAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    }
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                      px: 1.5,
                      py: 0.9,
                      border: '1px solid rgba(0,0,0,0.06)',
                      '&:hover': { backgroundColor: '#F9FAFB' },
                      '& .MuiButton-startIcon': { color: '#6BA3D0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <Typography sx={{ fontSize: { xs: '0.46rem', sm: '0.5rem', md: '0.54rem' }, fontWeight: 500, color: '#6B7280', lineHeight: 1.15 }}>
                        Periode
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' },
                          fontWeight: 500,
                          color: '#111827',
                          lineHeight: 1.15,
                        }}
                        noWrap
                      >
                        {periodValue}
                      </Typography>
                    </Box>
                  </Button>

                  <Button
                    onClick={handleProvinceClick}
                    variant="contained"
                    disableElevation
                    startIcon={<LocationOnIcon />}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transition: 'transform 200ms ease',
                          transform: provinceAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    }
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937',
                      borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                      px: 1.5,
                      py: 0.9,
                      border: '1px solid rgba(0,0,0,0.06)',
                      '&:hover': { backgroundColor: '#F9FAFB' },
                      '& .MuiButton-startIcon': { color: '#6BA3D0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <Typography sx={{ fontSize: { xs: '0.46rem', sm: '0.5rem', md: '0.54rem' }, fontWeight: 500, color: '#6B7280', lineHeight: 1.15 }}>
                        Provinsi
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' },
                          fontWeight: 500,
                          color: '#111827',
                          lineHeight: 1.15,
                        }}
                        noWrap
                        title={provinceValue}
                      >
                        {provinceValue}
                      </Typography>
                    </Box>
                  </Button>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* LOGOUT MENU DROPDOWN */}
      {logoutMenuAnchorEl && (
        <Menu
          anchorEl={logoutMenuAnchorEl}
          open={isLogoutMenuOpen}
          onClose={handleLogoutMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 190,
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08)',
              borderRadius: '14px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
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
              py: 1.25,
              px: 2,
              gap: 1.5,
              borderRadius: '10px',
              mx: 0.5,
              my: 0.25,
              '&:hover': {
                backgroundColor: 'rgba(107, 163, 208, 0.10)',
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
      )}

      {/* DASHBOARD FILTER MENUS */}
      {isDashboardPage && (
        <>
          <Menu
            anchorEl={periodAnchorEl}
            open={Boolean(periodAnchorEl)}
            onClose={handlePeriodClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            {periodOptions.map((option) => (
              <MenuItem
                key={option}
                selected={option === periodValue}
                onClick={() => handlePeriodChange(option)}
                sx={{ fontSize: { xs: '0.62rem', sm: '0.66rem' } }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={provinceAnchorEl}
            open={Boolean(provinceAnchorEl)}
            onClose={handleProvinceClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 240,
                maxHeight: 360,
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            {provinceOptions.map((option) => (
              <MenuItem
                key={option}
                selected={option === provinceValue}
                onClick={() => handleProvinceChange(option)}
                sx={{ fontSize: { xs: '0.62rem', sm: '0.66rem' } }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* DATE PICKER */}
      <Popover
        open={Boolean(calendarAnchorEl)}
        anchorEl={calendarAnchorEl}
        onClose={onCalendarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        keepMounted
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
    </>
  );
}

