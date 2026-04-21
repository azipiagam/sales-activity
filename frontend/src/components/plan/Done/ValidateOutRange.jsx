import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

const toInitials = (name) => {
  const source = String(name || '').trim();
  if (!source) return '--';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
};

export default function ValidateOutRange({
  customerName = '-',
  address = '-',
  distanceKm,
  radiusLimitKm = 2,
  loading = false,
  onConfirmWithoutSave,
  onConfirmAndSave,
  onCancel,
}) {
  const initials = useMemo(() => toInitials(customerName), [customerName]);
  const hasDistance = Number.isFinite(distanceKm);
  const distanceLabel = hasDistance ? `${distanceKm.toFixed(2)} KM` : '-';

  return (
    <Box sx={{ minHeight: '100dvh', width: '100%', backgroundColor: '#e9e7e2' }}>
      <Box sx={{ minHeight: '100dvh', width: '100%', backgroundColor: '#f7f7f5' }}>
        <Box sx={{ px: 3, pt: 4.5, pb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              borderRadius: 999,
              backgroundColor: '#eee7d5',
              px: 2,
              py: 1,
              color: '#7a542d',
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }}>Di luar radius</Typography>
          </Box>

          <Typography sx={{ mt: 3, fontSize: '1.55rem', fontWeight: 700, color: '#151515', lineHeight: 1.35 }}>
            Kamu lagi di lokasi customer yang benar?
          </Typography>

          <Typography sx={{ mt: 1.6, fontSize: '1rem', color: '#6d6d6d', lineHeight: 1.6 }}>
            Lokasimu berada di luar radius alamat utama customer yang tersimpan.
          </Typography>

          {/* <Typography sx={{ mt: 0.8, fontSize: '0.95rem', color: '#7a542d', fontWeight: 700 }}>
            Jarak: {distanceLabel} (maks. {radiusLimitKm} KM)
          </Typography>

          <Typography sx={{ mt: 0.85, fontSize: '0.92rem', color: '#8b5e34', lineHeight: 1.5 }}>
            Kamu bisa lanjutkan done tanpa simpan fix address, atau simpan lokasi ini sebagai fix address.
          </Typography> */}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mx: 3,
            mt: 0.5,
            borderRadius: 3,
            border: '1px solid #e2e0db',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 24px rgba(11, 30, 56, 0.06)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 2.25,
              py: 2.1,
              borderBottom: '1px solid #ece9e2',
              background: 'linear-gradient(180deg, rgba(247,247,245,0.9) 0%, rgba(255,255,255,1) 100%)',
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#35507f',
                backgroundColor: '#dde4ec',
                border: '1px solid #cfd8e3',
              }}
            >
              {initials}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1, pt: 0.2 }}>
              <Typography
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8c8b84',
                }}
              >
                Customer
              </Typography>
              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#151515',
                  lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {String(customerName || '-').toUpperCase()}
            </Typography>
            </Box>
          </Box>

          <Box sx={{ px: 2.25, py: 1.75 }}>
            <Typography
              sx={{
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8c8b84',
              }}
            >
              Alamat Customer
            </Typography>
            <Typography
              sx={{
                mt: 0.6,
                fontSize: '0.92rem',
                color: '#5f6470',
                lineHeight: 1.45,
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
              }}
            >
              {address}
            </Typography>
          </Box>

          <Box sx={{ p: 2.25, display: 'grid', gap: 1.25 }}>
            <Button
              type="button"
              disabled={loading}
              onClick={onConfirmWithoutSave}
              variant="contained"
              sx={{
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
              disabled={loading}
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
              Ya, dan simpan lokasi baru
            </Button>

            <Button
              type="button"
              disabled={loading}
              onClick={onCancel}
              variant="text"
              sx={{
                borderRadius: '14px',
                minHeight: 52,
                textTransform: 'none',
                fontWeight: 500,
                color: '#7c7c7c',
              }}
            >
              Tidak, aku salah
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
