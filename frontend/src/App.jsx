import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { motion, AnimatePresence } from 'framer-motion';

import NavBottom from './components/NavBottom';
import Header from './components/Header';
import MyTasks from './components/MyTasks';
import ActiveTask from './components/ActiveTask';
import History from './history/History';
import LoadingScreen from './components/LoadingScreen';
import Login from './login/login';
import { isAuthenticated } from './utils/auth';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6BA3D0',
    },
    secondary: {
      main: '#6BA3D0',
    },
  },
});

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navValue, setNavValue] = useState(location.pathname === '/history' ? 1 : 0);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [direction, setDirection] = useState(0); 

  useEffect(() => {
    if (location.pathname === '/history') {
      setNavValue(1);
    } else {
      setNavValue(0);
    }
  }, [location.pathname]);

  const handleNavChange = (newValue) => {
    if (newValue > navValue) {
      setDirection(1); 
    } else {
      setDirection(-1); 
    }
    
    setNavValue(newValue);
    if (newValue === 0) {
      navigate('/', { replace: false });
    } else {
      navigate('/history', { replace: false });
    }
  };

  const handleCalendarClick = (event) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handlePickerDateChange = (newDate) => {
    if (newDate) {
      setPickerDate(newDate);
      handleCalendarClose();
    }
  };

  const headerHeight = { xs: '180px', sm: '200px', md: '220px' };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F5F7FA',
      }}
    >
      {/* HEADER - Always visible, fixed at top */}
      <Header
        calendarAnchorEl={calendarAnchorEl}
        onCalendarClick={handleCalendarClick}
        onCalendarClose={handleCalendarClose}
        pickerDate={pickerDate}
        onPickerDateChange={handlePickerDateChange}
      />

      {/* CONTENT - Scrollable area with animation */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          pt: headerHeight,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            minHeight: '100%',
            overflowY: 'auto',
            backgroundColor: 'white',
            pb: 10,
            borderTopLeftRadius: { xs: '28px', sm: '32px', md: '36px' },
            borderTopRightRadius: { xs: '28px', sm: '32px', md: '36px' },
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
            transition: 'border-radius 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
          }}
        >
        <AnimatePresence mode="wait" initial={false}>
          {navValue === 0 ? (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: direction === -1 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === -1 ? 50 : -50 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{ width: '100%' }}
            >
              <MyTasks />
              <ActiveTask />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: direction === 1 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 1 ? -50 : 50 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{ width: '100%' }}
            >
              <History />
            </motion.div>
          )}
        </AnimatePresence>
        </Box>
      </Box>

      <NavBottom value={navValue} onChange={handleNavChange} />
    </Box>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); 

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LocalizationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
