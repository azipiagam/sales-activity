import React from 'react';
import Box from '@mui/material/Box';
import LatestCustomerDetail from '../components/LatestCustomerDetail';
import backgroundSvg from '../media/4.svg';

export default function CustomerDetailPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowY: 'auto',
        backgroundImage: `url(${backgroundSvg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        py: { xs: 3, sm: 4 },
      }}
    >
      <LatestCustomerDetail />
    </Box>
  );
}

