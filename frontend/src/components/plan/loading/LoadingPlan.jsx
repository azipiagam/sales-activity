
import React from 'react';
import { Box } from '@mui/material';
import Lottie from 'lottie-react';
import blueLoading from '../../../assets/media/loadingDots.json';

const overlaySx = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  zIndex: 9999,
};

const LoadingPlan = () => {
  return (
    <Box sx={overlaySx}>
      <Box
        sx={{
          width: { xs: 120, sm: 132 },
          height: { xs: 120, sm: 132 },
          filter: 'drop-shadow(0 8px 20px rgba(22, 58, 107, 0.16))',
        }}
      >
        <Lottie
          animationData={blueLoading}
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
  );
};

export default LoadingPlan;

