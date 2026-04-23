import React, { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import Webcam from 'react-webcam';

export default function CameraDone({
  saving = false,
  onCapture,
  onCameraErrorChange,
}) {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      const errorMessage = 'Gagal mengambil foto. Coba ulangi.';
      setCameraError(errorMessage);
      if (onCameraErrorChange) {
        onCameraErrorChange(errorMessage);
      }
      return;
    }
    setCameraError('');
    if (onCameraErrorChange) {
      onCameraErrorChange('');
    }
    onCapture(imageSrc);
  }, [onCapture, onCameraErrorChange]);

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        height: {
          xs: 'calc(100dvh - 206px)',
          sm: 'calc(100dvh - 230px)',
          md: 'calc(100dvh - 248px)',
        },
        minHeight: { xs: 320, sm: 380, md: 430 },
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
          if (onCameraErrorChange) {
            onCameraErrorChange('');
          }
        }}
        onUserMediaError={() => {
          const errorMessage = 'Tidak bisa mengakses kamera. Pastikan izin kamera aktif.';
          setCameraReady(false);
          setCameraError(errorMessage);
          if (onCameraErrorChange) {
            onCameraErrorChange(errorMessage);
          }
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
          top: { xs: 14, sm: 16 },
          right: { xs: 14, sm: 16 },
          zIndex: 8,
        }}
      >
        <IconButton
          onClick={handleCapture}
          disabled={saving || !cameraReady || Boolean(cameraError)}
          aria-label="Ambil foto"
          sx={{
            width: 54,
            height: 54,
            color: '#fff',
            background:
              'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            boxShadow: '0 8px 16px rgba(11, 30, 56, 0.25)',
            '&:hover': {
              background:
                'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            },
          }}
        >
          {cameraReady ? (
            <PhotoCameraRoundedIcon sx={{ fontSize: 28 }} />
          ) : (
            <CircularProgress size={22} color="inherit" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}
