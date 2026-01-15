
import React from 'react';
import { Box, Container } from '@mui/material';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const SkeletonLoading = () => {
  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 2,
        mb: 2,
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Render 2-3 skeleton cards */}
      {[1, 2, 3].map((index) => (
        <Box
          key={index}
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: { xs: '8px', sm: '10px', md: '12px' },
            padding: { xs: 1.5, sm: 2, md: 2.5 },
            border: '1px solid rgba(107, 163, 208, 0.2)',
            mb: index < 3 ? 2 : 0,
            position: 'relative',
          }}
        >
          {/* Skeleton untuk Nama Customer */}
          <Skeleton height={32} width="60%" style={{ marginBottom: 16 }} />

          {/* Skeleton untuk Date and Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Skeleton circle height={16} width={16} />
            <Skeleton height={14} width="30%" />
          </Box>

          {/* Skeleton untuk Plan No */}
          <Box sx={{ mb: 2 }}>
            <Skeleton height={12} width="20%" style={{ marginBottom: 4 }} />
            <Skeleton height={16} width="40%" />
          </Box>

          {/* Skeleton untuk Status Badge */}
          <Box sx={{ mb: 2 }}>
            <Skeleton height={12} width="15%" style={{ marginBottom: 4 }} />
            <Skeleton height={24} width="25%" />
          </Box>
          
          {/* Skeleton untuk Tujuan */}
          <Box sx={{ mb: 2 }}>
            <Skeleton height={12} width="18%" style={{ marginBottom: 4 }} />
            <Skeleton height={16} width="35%" />
          </Box>

          {/* Skeleton untuk Tambahan (kadang ada, kadang tidak) */}
          {index % 2 === 0 && (
            <Box sx={{ mb: 2 }}>
              <Skeleton height={12} width="22%" style={{ marginBottom: 4 }} />
              <Skeleton height={16} width="80%" />
              <Skeleton height={16} width="65%" />
            </Box>
          )}

          {/* Skeleton untuk Action Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Skeleton height={40} width="120px" style={{ borderRadius: 8 }} />
          </Box>
        </Box>
      ))}
    </Container>
  );
};

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
        <Skeleton circle height={160} width={160} />
      </Box>
    </Box>
  );
};

export { SkeletonLoading };
export default LoadingScreen;

