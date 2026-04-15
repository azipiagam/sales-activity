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
  refreshLoading = false,
  refreshDisabled = false,
}) {
  const normalizeActivityType = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    if (normalized === 'follow up' || normalized === 'follow_up' || normalized === 'followup') {
      return 'Follow Up';
    }
    return 'Visit';
  };

  const customerName = String(taskName || '').trim() || '-';
  const activityType = normalizeActivityType(tujuan);
  const visitCode = String(planNo || '').trim() || '-';
  const textOnBlueAccent = 'var(--text-on-blue-accent)';

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
            gap: 1.1,
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

          <Typography
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              color: textOnBlueAccent,
              fontWeight: 800,
              fontSize: { xs: '0.98rem', sm: '1.08rem' },
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            Done Result
          </Typography>

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

          <Box
            sx={{
              mt: 0.45,
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(235, 244, 255, 0.86)',
                fontWeight: 500,
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                letterSpacing: 0.2,
              }}
            >
              {visitCode}
            </Typography>

            <Box
              sx={{
                flexShrink: 0,
                px: 1.05,
                py: 0.45,
                borderRadius: '999px',
                backgroundColor: '#1f4e8c',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                boxShadow: '0 4px 10px rgba(8, 22, 42, 0.24)',
              }}
            >
              <Typography
                sx={{
                  color: textOnBlueAccent,
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.76rem' },
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                }}
              >
                {activityType}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
