import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import '../../../assets/styles/color.css';

export default function HeaderDone({
  onBack,
  taskName,
  planNo,
  tujuan,
  onRefreshLocation,
  showRefreshLocation = false,
  refreshLoading = false,
  refreshDisabled = false,
}) {
  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        background: 'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
        boxShadow: '0 8px 24px rgba(22, 58, 107, 0.24)',
      }}
    >
      <Box sx={{ position: 'relative', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton
          onClick={onBack}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
          aria-label="Kembali"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          Done Result
        </Typography>

        {showRefreshLocation ? (
          <IconButton
            onClick={onRefreshLocation}
            disabled={refreshDisabled}
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
            aria-label="Perbarui lokasi"
          >
            {refreshLoading ? <CircularProgress size={20} color="inherit" /> : <RestartAltIcon />}
          </IconButton>
        ) : null}
      </Box>

      <Box
        sx={{
          mt: 1.5,
          p: { xs: 1.5, sm: 1.75 },
          borderRadius: '14px',
          backgroundColor: '#fff',
          boxShadow: '0 10px 24px rgba(8, 20, 42, 0.18)',
          border: '1px solid rgba(31, 78, 140, 0.12)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.25,
        }}
      >
        <Box sx={{ width: '100%', minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 0.2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#7a7a7a',
                fontWeight: 700,
              }}
            >
              {planNo || '-'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#7a7a7a',
                fontWeight: 700,
                textAlign: 'right',
              }}
            >
              {tujuan || '-'}
            </Typography>
          </Box>

          <Box
            sx={{
              height: '1px',
              my: 0.9,
              borderRadius: '999px',
              background:
                'linear-gradient(90deg, rgba(22, 58, 107, 0.08) 0%, rgba(22, 58, 107, 0.28) 50%, rgba(22, 58, 107, 0.08) 100%)',
            }}
          />

          <Typography
            variant="body1"
            sx={{
              color: '#1d3557',
              fontWeight: 700,
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            {taskName || '-'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
