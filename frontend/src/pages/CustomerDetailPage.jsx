import React from 'react';
import Box from '@mui/material/Box';
import LatestCustomerDetail from '../components/LatestCustomerDetail';

export default function CustomerDetailPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowY: 'auto',
        overscrollBehaviorY: 'contain',
        py: { xs: 3, sm: 4 },
      }}
    >
      <LatestCustomerDetail />
    </Box>
  );
}

