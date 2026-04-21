import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import successAnimation from '../../../assets/media/Success2.json';

const toInitials = (name) => {
  const source = String(name || '').trim();
  if (!source) return '--';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
};

const formatCompletedAt = (value) => {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const datePart = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(safeDate);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(safeDate);
  return `${datePart} - ${timePart}`;
};

export default function SucceedScreen({
  customerName = '-',
  address = 'Alamat tidak tersedia',
  completedAt,
  onViewHistory,
}) {
  const initials = useMemo(() => toInitials(customerName), [customerName]);
  const completedAtText = useMemo(() => formatCompletedAt(completedAt), [completedAt]);

  return (
    <Box sx={{ minHeight: '100dvh', width: '100%', backgroundColor: '#f3f3f0' }}>
      <Box sx={{ minHeight: '100dvh', width: '100%', overflow: 'hidden', backgroundColor: '#f7f7f5' }}>
        <Box
          sx={{
            backgroundColor: '#e8eedc',
            px: 3,
            pt: 5,
            pb: 4,
            textAlign: 'center',
            borderBottom: '1px solid #d7dccd',
          }}
        >
          <Box
            sx={{
              mx: 'auto',
              display: 'flex',
              width: 116,
              height: 116,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(75, 111, 31, 0.12)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
            }}
          >
            <Lottie
              animationData={successAnimation}
              loop={false}
              autoplay
              style={{ width: 96, height: 96 }}
            />
          </Box>

          <Typography
            component={motion.h1}
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20, mass: 0.7, delay: 0.08 }}
            sx={{ mt: 3, fontSize: '2rem', fontWeight: 500, lineHeight: 1, color: '#385418' }}
          >
            Done!
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '1.05rem', lineHeight: 1.35, color: '#6a755d' }}>
            {completedAtText}
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 4 }}>
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#8c8b84',
            }}
          >
            Kamu lagi di
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: '#dde4ec',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#35507f',
              }}
            >
              {initials}
            </Box>

            <Box sx={{ minWidth: 0, pt: 0.5 }}>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, color: '#151515' }}>
                {String(customerName || '-').toUpperCase()}
              </Typography>
              <Typography sx={{ mt: 1, fontSize: '0.98rem', lineHeight: 1.6, color: '#666' }}>
                {address}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, borderTop: '1px solid #ddddda' }} />

          <Button
            type="button"
            fullWidth
            onClick={onViewHistory}
            sx={{
              mt: 4,
              borderRadius: '18px',
              border: '1px solid #bdbbb4',
              backgroundColor: '#d8d7d2',
              py: 2,
              fontSize: '1.15rem',
              fontWeight: 400,
              color: '#5f615d',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#cdcbc5',
                borderColor: '#b0aea7',
              },
            }}
          >
            Lihat riwayat
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
