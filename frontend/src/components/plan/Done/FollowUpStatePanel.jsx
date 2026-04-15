import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';

export default function FollowUpStatePanel() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 22% 18%, rgba(31, 78, 140, 0.2) 0%, rgba(31, 78, 140, 0) 36%), linear-gradient(162deg, #eef4fc 0%, #e0ebfa 46%, #d2e1f6 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '38%', sm: '44%' },
          left: '50%',
          transform: 'translate(-50%, -50%)',
          px: 2,
          width: '100%',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            aria-label="Icon Follow Up"
            sx={{
              width: { xs: 84, sm: 96 },
              height: { xs: 84, sm: 96 },
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              background: 'linear-gradient(145deg, #1d4a86 0%, #2c66b0 100%)',
              boxShadow: '0 12px 20px rgba(22, 58, 107, 0.22)',
            }}
          >
            <AssignmentReturnRoundedIcon sx={{ color: '#f5f9ff', fontSize: { xs: '2.2rem', sm: '2.6rem' } }} />
          </Box>
          <Typography
            sx={{
              mt: 1,
              color: '#173f6e',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            Ini adalah halaman Follow Up.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
