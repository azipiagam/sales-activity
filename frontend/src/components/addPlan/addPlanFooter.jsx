// React
import React from 'react';

// Material-UI Components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// Material-UI Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function AddPlanFooter({
  onCancel,
  onCreate,
  loading = false,
  createDisabled = false
}) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(107, 163, 208, 0.1)',
        boxShadow: '0 -4px 20px rgba(107, 163, 208, 0.1)',
        p: { xs: 2, sm: 2.5 },
        borderRadius: { xs: '16px 16px 0 0', sm: '20px 20px 0 0' },
        zIndex: 10,
        mt: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 2, sm: 2.5 },
          maxWidth: 'md',
          mx: 'auto',
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={onCancel}
          disabled={loading}
          sx={{
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 600,
            borderColor: '#6BA3D0',
            color: '#6BA3D0',
            borderRadius: { xs: 2.5, sm: 3 },
            textTransform: 'none',
            borderWidth: '2px',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#5a8fb8',
              backgroundColor: 'rgba(107, 163, 208, 0.08)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(107, 163, 208, 0.15)',
            },
            '&:disabled': {
              borderColor: '#d1d5db',
              color: '#9ca3af',
              backgroundColor: 'transparent',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={onCreate}
          disabled={loading || createDisabled}
          sx={{
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: '#6BA3D0',
            color: 'white',
            borderRadius: { xs: 2.5, sm: 3 },
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(107, 163, 208, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#5a8fb8',
              color: 'white',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(107, 163, 208, 0.4)',
            },
            '&:disabled': {
              backgroundColor: '#6BA3D0',
              opacity: 0.6,
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            <>
              <PersonAddIcon sx={{ mr: 0.75, fontSize: '1.1rem' }} />
              Create Plan
            </>
          )}
        </Button>
      </Box>
    </Box>
  );
}
