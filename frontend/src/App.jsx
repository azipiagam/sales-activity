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
import Dashboard from './Dashboard';
import LoadingManager from './components/loading/LoadingManager';
import Login from './login/login';
import ErrorBoundary from './components/ErrorBoundary';
import { isAuthenticated } from './utils/auth';
import { ActivityPlanProvider } from './contexts/ActivityPlanContext';
import GoogleMapsProvider from './components/GoogleMapsProvider';
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
  const [isDateCarouselLoading, setIsDateCarouselLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardPeriod, setDashboardPeriod] = useState('Bulan ini');
  const [dashboardProvince, setDashboardProvince] = useState('Semua Provinsi');
  const [dashboardProvinceOptions, setDashboardProvinceOptions] = useState(['Semua Provinsi']);

  // Intentionally avoid global window error suppression (surface errors during development).

  useEffect(() => {
    // Pastikan setelah login pertama kali, user selalu melihat Dashboard
    // navValue = 0 → Dashboard
    // navValue = 1 → Plan (My Activity Plan)
    if (location.pathname === '/plan') {
      setNavValue(1);
    } else {
      // Default ke Dashboard (navValue = 0) untuk route '/' atau route lainnya
      setNavValue(0);
    }
  }, [location.pathname]);

  const handleNavChange = (newValue) => {
    setNavValue(newValue);
    // navValue = 0 → Dashboard → route '/'
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

  const handlePickerDateChange = (newDate) => {
    if (newDate) {
      setPickerDate(newDate);
      setSelectedDate(newDate); 
      handleCalendarClose();
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const headerHeight = { xs: '150px', sm: '157px', md: '170px' };

  useEffect(() => {
    if (Array.isArray(dashboardProvinceOptions) && dashboardProvinceOptions.length > 0) {
      if (!dashboardProvinceOptions.includes(dashboardProvince)) {
        setDashboardProvince('Semua Provinsi');
      }
    }
  }, [dashboardProvinceOptions, dashboardProvince]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        overflow: 'hidden',
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
        onRefresh={handleRefresh}
        dashboardPeriod={dashboardPeriod}
        onDashboardPeriodChange={setDashboardPeriod}
        dashboardProvince={dashboardProvince}
        onDashboardProvinceChange={setDashboardProvince}
        dashboardProvinceOptions={dashboardProvinceOptions}
      />

      {/* Full-screen loading overlay for DateCarousel actions (iOS Safari can clip fixed children inside the Header) */}
      {isDateCarouselLoading && <LoadingManager type="moveDate" />}

      {/* CONTENT - Scrollable area with animation */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          pt: headerHeight,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
            pb: 10,
          }}
        >
        {/* Page content with smooth transitions */}
        <AnimatePresence mode="wait">
          {navValue === 0 ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
              }}
              style={{ width: '100%' }}
            >
              <Dashboard
                refreshKey={refreshKey}
                periodFilter={dashboardPeriod}
                onPeriodFilterChange={setDashboardPeriod}
                provinceFilter={dashboardProvince}
                onProvinceFilterChange={setDashboardProvince}
                onProvinceOptionsChange={setDashboardProvinceOptions}
              />
            </motion.div>
          ) : (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
              }}
              style={{ width: '100%' }}
            >
              <MyTasks selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
              <ActiveTask selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
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
            <GoogleMapsProvider>
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
            </GoogleMapsProvider>
          </LocalizationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
