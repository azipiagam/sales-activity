import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import '../../../assets/styles/color.css';

export default function HeaderDone({
  onBack,
  taskName,
  planNo,
  tujuan,
  currentAddress,
  addressLoading = false,
  onRefreshLocation,
  showRefreshLocation = false,
  refreshLoading = false,
  refreshDisabled = false,
}) {
  const themeBlueOverlay = 'var(--theme-blue-overlay)';
  const themeBluePrimary = 'var(--theme-blue-primary)';
  const headerGradient =
    `linear-gradient(135deg, ${themeBlueOverlay} 0%, ${themeBluePrimary} 100%)`;
  const textOnBluePrimary = 'var(--text-on-blue-primary)';
  const textOnBlueSecondary = 'var(--text-on-blue-secondary)';
  const textOnBlueAccent = 'var(--text-on-blue-accent)';
  const locationText = addressLoading
    ? 'Mengambil alamat...'
    : (String(currentAddress || '').trim() || 'Lokasi belum diambil');

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        background: headerGradient,
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
            color: textOnBluePrimary,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
          aria-label="Kembali"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: textOnBlueAccent, textAlign: 'center' }}>
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
              color: textOnBluePrimary,
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
          mt: 1.2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.7,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            maxWidth: '100%',
          }}
        >
          <PersonOutlineIcon sx={{ color: textOnBlueAccent, fontSize: 19, flexShrink: 0 }} />
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                color: textOnBluePrimary,
                fontWeight: 700,
                fontSize: { xs: '0.82rem', sm: '0.9rem' },
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={taskName || '-'}
            >
              {taskName || '-'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Typography
            variant="body2"
            sx={{
              color: textOnBlueSecondary,
              fontWeight: 600,
              fontSize: { xs: '0.72rem', sm: '0.78rem' },
            }}
          >
            {planNo || '-'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textOnBlueAccent,
              fontWeight: 500,
              fontSize: { xs: '0.72rem', sm: '0.78rem' },
            }}
          >
            {tujuan || '-'}
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            mt: 0.25,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 0.5,
            px: { xs: 0.2, sm: 1 },
          }}
        >
          <LocationOnOutlinedIcon
            sx={{
              color: textOnBlueAccent,
              fontSize: 16.5,
              mt: 0.05,
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0, maxWidth: { xs: '84vw', sm: '76vw', md: '60vw' } }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: textOnBlueAccent,
                fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                lineHeight: 1.15,
                textAlign: 'left',
              }}
            >
              Lokasi
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: '-webkit-box',
                color: textOnBlueSecondary,
                fontWeight: 600,
                fontSize: { xs: '0.68rem', sm: '0.74rem' },
                lineHeight: 1.3,
                textAlign: 'left',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
              title={locationText}
            >
              {locationText}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
