import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { motion, AnimatePresence } from 'framer-motion';

// Global error handler untuk DOM manipulation errors
const handleGlobalError = (event) => {
  // Suppress specific DOM errors yang sering muncul di production
  if (event.message && (
    event.message.includes('removeChild') ||
    event.message.includes('Node') ||
    event.message.includes('child of this node')
  )) {
    console.warn('Suppressed DOM manipulation error:', event.message);
    event.preventDefault();
    return false;
  }
};

const handleUnhandledRejection = (event) => {
  // Suppress promise rejections related to DOM manipulation
  if (event.reason && typeof event.reason === 'string' && (
    event.reason.includes('removeChild') ||
    event.reason.includes('Node')
  )) {
    console.warn('Suppressed DOM promise rejection:', event.reason);
    event.preventDefault();
    return false;
  }
};

import NavBottom from './components/NavBottom';
import Header from './components/Header';
import MyTasks from './components/MyTasks';
import ActiveTask from './components/ActiveTask';
import Home from './Home';
import LoadingManager from './components/loading/LoadingManager';
import Login from './login/login';
import ErrorBoundary from './components/ErrorBoundary';
import { isAuthenticated } from './utils/auth';
import { ActivityPlanProvider } from './contexts/ActivityPlanContext';
import backgroundSvg from './media/4.svg';
import CustomerDetailPage from './pages/CustomerDetailPage';

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
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
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
  const [navValue, setNavValue] = useState(location.pathname === '/plan' ? 1 : 0);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [isDateCarouselLoading, setIsDateCarouselLoading] = useState(false);

  // Setup global error handlers
  useEffect(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []); 

  useEffect(() => {
    // Pastikan setelah login pertama kali, user selalu melihat Home
    // navValue = 0 → Home
    // navValue = 1 → Plan (My Activity Plan)
    if (location.pathname === '/plan') {
      setNavValue(1);
    } else {
      // Default ke Home (navValue = 0) untuk route '/' atau route lainnya
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
    // navValue = 0 → Home → route '/'
    // navValue = 1 → Plan (My Activity Plan) → route '/plan'
    if (newValue === 0) {
      navigate('/', { replace: false });
    } else {
      navigate('/plan', { replace: false });
    }
  };

  const handleCalendarClick = (event) => {
    if (event && event.currentTarget) {
      setPickerDate(selectedDate);
      setCalendarAnchorEl(event.currentTarget);
    }
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  // Cleanup calendar anchor when component updates
  useEffect(() => {
    return () => {
      if (calendarAnchorEl) {
        setCalendarAnchorEl(null);
      }
    };
  }, [calendarAnchorEl]);

  const handlePickerDateChange = (newDate) => {
    if (newDate) {
      setPickerDate(newDate);
      setSelectedDate(newDate); 
      handleCalendarClose();
    }
  };

  const headerHeight = { xs: '170px', sm: '185px', md: '200px' };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
      }}
    >
      {/* HEADER - Always visible, fixed at top */}
      <Header
        calendarAnchorEl={calendarAnchorEl}
        onCalendarClick={handleCalendarClick}
        onCalendarClose={handleCalendarClose}
        pickerDate={pickerDate}
        onPickerDateChange={handlePickerDateChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onDateCarouselLoadingChange={setIsDateCarouselLoading}
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
            backgroundImage: `url(${backgroundSvg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            pb: 10,
            mt: { xs: '-20px', sm: '-28px', md: '-30px' },
          }}
        >
        {/* Custom page transition without AnimatePresence to avoid Portal conflicts */}
        <motion.div
          key={`page-${navValue}`}
          initial={{
            opacity: 0,
            x: direction === -1 ? -50 : 50
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{ width: '100%' }}
        >
          {navValue === 0 ? (
            <Home />
          ) : (
            <>
              <MyTasks selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
              <ActiveTask selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
            </>
          )}
        </motion.div>
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
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingManager type="default" />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Disable React.StrictMode to prevent double mounting in development */}
        <BrowserRouter>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
            <ActivityPlanProvider>
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
                  path="/plan"
                  element={
                    <ProtectedRoute>
                      <AppContent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <ProtectedRoute>
                      <CustomerDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ActivityPlanProvider>
          </LocalizationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
