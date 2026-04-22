import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import HeaderDone from './HeaderDone';
import CameraDone from './CameraDone';
import CardDone from './CardDone';
import PopupValidationDone from './PopupValidationDone';

export default function FollowUpPage({
  taskName,
  planNo,
  tujuan,
  onBack,
  onRefreshLocation,
  refreshLoading,
  refreshDisabled,
  cameraActive = false,
  saving = false,
  onCameraCapture,
  onCameraErrorChange,
  capturedImage,
  cameraError,
  result,
  onResultChange,
  onOpenCamera,
  onRemoveImage,
  onSaveResult,
  validationPopup,
  onConfirmValidationPopup,
  onCancelValidationPopup,
  showLocationLoadingOverlay = false,
}) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
        backgroundColor: '#edf2f8',
        overflow: 'hidden',
      }}
    >
      <HeaderDone
        onBack={onBack}
        taskName={taskName}
        planNo={planNo}
        tujuan={tujuan}
        onRefreshLocation={onRefreshLocation}
        refreshLoading={refreshLoading}
        refreshDisabled={refreshDisabled}
      />

      {cameraActive ? (
        <CameraDone
          saving={saving}
          onCapture={onCameraCapture}
          onCameraErrorChange={onCameraErrorChange}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: 'calc(100dvh - 116px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1.5, sm: 2 },
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 540,
                mx: 'auto',
                height: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(22, 58, 107, 0.15)',
                backgroundColor: '#cfdced',
                boxShadow: '0 12px 24px rgba(10, 28, 53, 0.18)',
                position: 'relative',
              }}
            >
              {capturedImage ? (
                <Box
                  component="img"
                  src={capturedImage}
                  alt="Swafoto Follow Up"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    px: 3,
                    background:
                      'linear-gradient(160deg, rgba(224, 236, 250, 1) 0%, rgba(201, 219, 241, 1) 100%)',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#27486e',
                      fontWeight: 700,
                      fontSize: { xs: '0.9rem', sm: '0.98rem' },
                      lineHeight: 1.45,
                    }}
                  >
                    Belum ada swafoto.
                    <br />
                    Ambil foto untuk ditampilkan di latar belakang.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1250,
          px: { xs: 0, sm: 1 },
          pointerEvents: 'none',
        }}
      >
        <Paper
          sx={{
            pointerEvents: 'auto',
            mx: 'auto',
            width: '100%',
            maxWidth: 540,
            minHeight: 250,
            maxHeight: '56dvh',
            pt: 1.35,
            px: { xs: 2, sm: 2.5 },
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            borderRadius: { xs: '24px 24px 0 0', sm: '26px 26px 0 0' },
            border: '1px solid rgba(22, 58, 107, 0.11)',
            borderBottom: 'none',
            backgroundColor: '#ffffff',
            boxShadow: '0 -16px 30px rgba(11, 30, 56, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 5,
              borderRadius: '999px',
              backgroundColor: 'rgba(22, 58, 107, 0.2)',
              mx: 'auto',
              mb: 1.4,
              flexShrink: 0,
            }}
          />

          {cameraActive ? (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: cameraError ? '#b3261e' : '#1b3557',
                fontWeight: 700,
                mb: 1.15,
              }}
            >
              {cameraError || 'Kamera aktif. Gunakan tombol Ambil Foto di layar kamera.'}
            </Typography>
          ) : null}

          <CardDone
            result={result}
            onResultChange={onResultChange}
            capturedImage={capturedImage}
            onOpenCamera={onOpenCamera}
            onRemoveImage={onRemoveImage}
            disabled={saving}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={onSaveResult}
            disabled={saving}
            sx={{
              mt: 1.6,
              minHeight: 52,
              textTransform: 'none',
              borderRadius: '11px',
              fontWeight: 700,
              fontSize: '0.98rem',
              color: '#fff',
              backgroundColor: '#163a6b',
              '&:hover': {
                backgroundColor: '#1f4e8c',
              },
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
          </Button>
        </Paper>
      </Box>

      <PopupValidationDone
        open={validationPopup?.open}
        title={validationPopup?.title}
        message={validationPopup?.message}
        type={validationPopup?.type}
        confirmText={validationPopup?.confirmText}
        cancelText={validationPopup?.cancelText}
        showCancel={validationPopup?.showCancel}
        disableBackdropClose={saving}
        onConfirm={onConfirmValidationPopup}
        onCancel={onCancelValidationPopup}
      />

      {showLocationLoadingOverlay ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10, 18, 34, 0.7)',
            px: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              textAlign: 'center',
            }}
          >
            <CircularProgress
              size={52}
              thickness={4.5}
              sx={{ color: '#FFFFFF' }}
            />
            <Box>
              <Typography
                sx={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                Mengambil lokasi Anda
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.4,
                  color: 'rgba(255, 255, 255, 0.82)',
                }}
              >
                Mohon tunggu sebentar agar halaman Done siap digunakan.
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
