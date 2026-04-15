import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';
import BackgroundMain from './assets/media/Background';

import {
  ActiveTask,
  ErrorBoundary,
  GoogleMapsProvider,
  Header,
  LoadingManager,
  MyTasks,
  NavBottom,
} from './components';
import Dashboard from './Dashboard';
import Login from './login/login';
import { isAuthenticated } from './utils/auth';
import { ActivityPlanProvider } from './contexts/ActivityPlanContext';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ChangePasswordPage from './login/ChangePasswordPage';
import DonePage from './components/plan/Done/DonePage';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import { DEFAULT_DASHBOARD_PERIOD } from './constants/dashboardPeriods';

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
  const normalizedPathname = useMemo(() => {
    const trimmed = String(location.pathname || '').replace(/\/+$/, '');
    return trimmed || '/';
  }, [location.pathname]);
  const isDonePage = normalizedPathname === '/plan/done';
  const [navValue, setNavValue] = useState(location.pathname.startsWith('/plan') ? 1 : 0);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateCarouselLoading, setIsDateCarouselLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardPeriod, setDashboardPeriod] = useState(DEFAULT_DASHBOARD_PERIOD);
  const [dashboardProvince, setDashboardProvince] = useState('Semua Provinsi');
  const [dashboardProvinceOptions, setDashboardProvinceOptions] = useState(['Semua Provinsi']);

  // Intentionally avoid global window error suppression (surface errors during development).

  useEffect(() => {
    // Pastikan setelah login pertama kali, user selalu melihat Dashboard
    // navValue = 0 → Dashboard
    // navValue = 1 → Plan (My Activity Plan)
    if (normalizedPathname.startsWith('/plan')) {
      setNavValue(1);
      return;
    }

    if (normalizedPathname === '/') {
      setNavValue(0);
      return;
    }

    navigate('/', { replace: true });
  }, [normalizedPathname, navigate]);

  useEffect(() => {
    // Bersihkan query parameter dari halaman done ketika user sudah ada di /plan.
    if (normalizedPathname !== '/plan' || !location.search) return;

    const searchParams = new URLSearchParams(location.search);
    const hasDoneParams = searchParams.has('taskId') || searchParams.has('date');
    if (!hasDoneParams) return;

    navigate('/plan', { replace: true });
  }, [normalizedPathname, location.search, navigate]);

  useEffect(() => {
    setCalendarAnchorEl(null);
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
        position: 'relative',
      }}
    >
      <BackgroundMain />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isDonePage && (
          <>
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
          </>
        )}

        {/* CONTENT - Scrollable area with animation */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            pt: isDonePage ? 0 : headerHeight,
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
          {/* Keep only enter animation here; exit animations can conflict with MUI portals/modals. */}
          {navValue === 0 ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
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
              key={isDonePage ? 'plan-done' : 'plan-main'}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
              }}
              style={{ width: '100%' }}
            >
              {isDonePage ? (
                <DonePage />
              ) : (
                <>
                  <MyTasks selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
                  <ActiveTask selectedDate={selectedDate} isDateCarouselLoading={isDateCarouselLoading} />
                </>
              )}
            </motion.div>
          )}
          </Box>
        </Box>

        {!isDonePage && <NavBottom value={navValue} onChange={handleNavChange} />}
      </Box>
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
                  <Route path="/change-password" element={<ChangePasswordPage />} />
                  <Route
                    path="/customers/:id"
                    element={
                      <ProtectedRoute>
                        <CustomerDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppContent />
                      </ProtectedRoute>
                    }
                  />
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
