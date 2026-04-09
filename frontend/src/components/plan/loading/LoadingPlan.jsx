
import React from 'react';
import { Box } from '@mui/material';
import Lottie from 'lottie-react';
import blueLoading from '../../../assets/media/loadingDots.json';
import BackgroundMain from '../../../assets/media/Background';

const LoadingMoveDate = () => {
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
        backgroundColor: '#F5F7FA',
        zIndex: 9999,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)', 
          backdropFilter: 'blur(2px)', 
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1,
        },
      }}
    >
      <BackgroundMain />

      <Box 
        sx={{ 
          width: 160, 
          height: 160,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Lottie
          animationData={blueLoading}
          loop
        />
      </Box>
    </Box>
  );
};

export default LoadingMoveDate;

