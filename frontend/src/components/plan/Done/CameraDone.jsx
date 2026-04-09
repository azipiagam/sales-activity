import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Webcam from 'react-webcam';

export default function CameraDone({ saving = false, onCapture, onCancel }) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setCameraError('Gagal mengambil foto. Coba ulangi.');
      return;
    }
    setCameraError('');
    onCapture(imageSrc);
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        height: { xs: 360, sm: 460, md: 520 },
        overflow: 'hidden',
        borderBottom: '1px solid rgba(22, 58, 107, 0.14)',
        backgroundColor: '#0f172a',
      }}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.85}
        videoConstraints={{
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }}
        onUserMedia={() => {
          setCameraReady(true);
          setCameraError('');
        }}
        onUserMediaError={() => {
          setCameraReady(false);
          setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera aktif.');
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {!cameraReady && !cameraError ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(9, 14, 27, 0.35)',
            color: '#fff',
            gap: 1,
          }}
        >
          <CircularProgress size={20} color="inherit" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Menyiapkan kamera...
          </Typography>
        </Box>
      ) : null}

      {cameraError ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(9, 14, 27, 0.55)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
            {cameraError}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          gap: 1.25,
          background: 'linear-gradient(180deg, rgba(9,14,27,0) 0%, rgba(9,14,27,0.72) 55%)',
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={onCancel}
          disabled={saving}
          sx={{
            textTransform: 'none',
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(2px)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          Kembali ke Map
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleCapture}
          disabled={saving || !cameraReady}
          sx={{
            textTransform: 'none',
            color: '#fff',
            background:
              'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            '&:hover': {
              background:
                'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            },
          }}
        >
          Ambil Foto
        </Button>
      </Box>
    </Box>
  );
}
