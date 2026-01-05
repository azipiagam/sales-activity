import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import NavBottom from '../components/NavBottom';
import Header from '../components/Header';
import LatestCustomerDetail from '../components/LatestCustomerDetail';
import backgroundSvg from '../media/4.svg';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [navValue, setNavValue] = useState(0);

  const handleNavChange = (newValue) => {
    setNavValue(newValue);
    if (newValue === 0) {
      navigate('/', { replace: false });
    } else {
      navigate('/plan', { replace: false });
    }
  };

  const handleCalendarClick = (event) => {
    setPickerDate(selectedDate); 
    setCalendarAnchorEl(event.currentTarget);
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
      />

      {/* CONTENT - Scrollable area */}
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
          <LatestCustomerDetail />
        </Box>
      </Box>

      <NavBottom value={navValue} onChange={handleNavChange} />
    </Box>
  );
}

