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
  onRefreshLocation,
  refreshLoading = false,
  refreshDisabled = false,
}) {
  const customerName = String(taskName || '').trim() || '-';
  const visitCode = String(planNo || '').trim() ? `${planNo} Visit` : '- Visit';

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#163a6b',
        boxShadow: '0 10px 28px rgba(10, 28, 53, 0.3)',
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          width: '100%',
          maxWidth: 540,
          px: { xs: 2, sm: 2.5 },
          pt: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          pb: 1.8,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <IconButton
            onClick={onBack}
            sx={{
              color: '#f7fbff',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              width: 38,
              height: 38,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
              },
            }}
            aria-label="Kembali"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <IconButton
            onClick={onRefreshLocation}
            disabled={refreshDisabled}
            sx={{
              color: '#f7fbff',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              width: 38,
              height: 38,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
              },
            }}
            aria-label="Perbarui lokasi"
          >
            {refreshLoading ? <CircularProgress size={18} color="inherit" /> : <RestartAltIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Box
          sx={{
            mt: 1.2,
            px: 0.4,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: '#f7fbff',
              fontWeight: 700,
              lineHeight: 1.25,
              fontSize: { xs: '1rem', sm: '1.08rem' },
              letterSpacing: 0.2,
            }}
            title={customerName}
          >
            {customerName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.45,
              color: 'rgba(235, 244, 255, 0.86)',
              fontWeight: 500,
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              letterSpacing: 0.2,
            }}
          >
            {visitCode}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
