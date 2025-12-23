import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} thickness={4} />
    </Box>
  );
};

export default LoadingScreen;

