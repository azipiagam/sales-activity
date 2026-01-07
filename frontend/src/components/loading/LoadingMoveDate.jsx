
import React from 'react';
import { Box } from '@mui/material';
import Lottie from 'lottie-react';
import blueLoading from '../../media/MoveDate.json';
import backgroundSvg from '../../media/background.svg';

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
        backgroundImage: `url(${backgroundSvg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
          zIndex: 0,
        },
      }}
    >
      <Box 
        sx={{ 
          width: 160, 
          height: 160,
          position: 'relative',
          zIndex: 1,
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

