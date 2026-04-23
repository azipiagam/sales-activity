import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function ValidateOutRange({
  distanceKm,
  radiusLimitKm = 2,
  onConfirmWithoutSave,
  onConfirmAndSave,
  onCancel,
}) {
  const hasDistance = Number.isFinite(distanceKm);
  const distanceLabel = hasDistance ? `${distanceKm.toFixed(2)} KM` : '-';

  return (
    <Box sx={{ display: 'grid', gap: 1.25 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          alignSelf: 'flex-start',
          borderRadius: 999,
          backgroundColor: '#fdf1d7',
          px: 1.6,
          py: 0.85,
          color: '#80551f',
        }}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: 19 }} />
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>Di luar radius</Typography>
      </Box>

      <Typography sx={{ mt: 0.2, fontSize: '1.14rem', fontWeight: 700, color: '#151515', lineHeight: 1.35 }}>
        Kamu lagi di lokasi customer yang benar?
      </Typography>


      <Typography sx={{ fontSize: '0.88rem', color: '#8b5e34', fontWeight: 700 }}>
        Jarak: {distanceLabel} (maks. {radiusLimitKm} KM)
      </Typography>

      <Button
        type="button"
        onClick={onConfirmWithoutSave}
        variant="contained"
        sx={{
          mt: 0.35,
          borderRadius: '14px',
          minHeight: 52,
          textTransform: 'none',
          fontWeight: 700,
          backgroundColor: '#163a6b',
          color: '#ffffff',
          border: '1px solid #163a6b',
          boxShadow: '0 6px 14px rgba(11, 30, 56, 0.12)',
          '&:hover': {
            backgroundColor: '#1f4e8c',
            borderColor: '#1f4e8c',
            boxShadow: '0 8px 16px rgba(11, 30, 56, 0.16)',
          },
        }}
      >
        Ya, ini lokasi yang benar
      </Button>

      <Button
        type="button"
        onClick={onConfirmAndSave}
        variant="outlined"
        sx={{
          borderRadius: '14px',
          minHeight: 52,
          textTransform: 'none',
          fontWeight: 700,
          borderColor: '#163a6b',
          color: '#163a6b',
          '&:hover': {
            borderColor: '#1f4e8c',
            backgroundColor: 'rgba(31, 78, 140, 0.07)',
          },
        }}
      >
        Ya, dan simpan lokasi baru ini
      </Button>

      <Button
        type="button"
        onClick={onCancel}
        variant="text"
        sx={{
          borderRadius: '14px',
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 500,
          color: '#7c7c7c',
        }}
      >
        Tidak, aku salah lokasi
      </Button>
    </Box>
  );
}
