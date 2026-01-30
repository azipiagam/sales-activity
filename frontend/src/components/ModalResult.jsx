import React, { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Webcam from 'react-webcam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function ModalResult({
  openModal,
  handleCloseModal,
  result,
  setResult,
  handleSaveResult,
  saving,
  capturedImage,
  setCapturedImage
}) {
  // State untuk kamera - gunakan state lokal untuk menghindari race conditions
  const [cameraActive, setCameraActive] = useState(false);
  const [localCapturedImage, setLocalCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);

  const currentCapturedImage = capturedImage !== undefined ? capturedImage : localCapturedImage;
  const setCurrentCapturedImage = setCapturedImage !== undefined ? setCapturedImage : setLocalCapturedImage;

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup webcam stream dengan aman
  const cleanupWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsWebcamReady(false);
  }, []);

  // Cleanup saat modal ditutup atau component unmount
  useEffect(() => {
    if (!openModal) {
      setCameraActive(false);
      setCameraError(null);
      cleanupWebcam();
    }
  }, [openModal, cleanupWebcam]);

  // Cleanup saat component unmount
  useEffect(() => {
    return () => {
      cleanupWebcam();
    };
  }, [cleanupWebcam]);

  const openCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsWebcamReady(false);
      setCameraActive(true);
    } catch (error) {
      console.error('Error opening camera:', error);
      setCameraError('Tidak dapat mengakses kamera');
      setCameraActive(false);
    }
  }, []);

  const closeCamera = useCallback(() => {
    cleanupWebcam();
    setCameraActive(false);
    setCameraError(null);
  }, [cleanupWebcam]);

  // Kompres gambar dengan error handling yang lebih baik
  const compressImage = useCallback((base64Image, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            let { width, height } = img;

            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64Image;
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !isWebcamReady) {
      console.warn('Webcam not ready for capture');
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture screenshot');
      }

      const compressedImage = await compressImage(imageSrc, 640, 0.20); // 640px max, 50% quality
      setCurrentCapturedImage(compressedImage);
      closeCamera();
    } catch (error) {
      console.error('Error capturing/compressing image:', error);
      // Fallback: gunakan gambar asli tanpa kompresi
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setCurrentCapturedImage(imageSrc);
          closeCamera();
        }
      } catch (fallbackError) {
        console.error('Fallback capture also failed:', fallbackError);
        setCameraError('Gagal mengambil foto');
      }
    }
  }, [isWebcamReady, compressImage, closeCamera, setCurrentCapturedImage]);

  const removeCapturedImage = () => {
    setCurrentCapturedImage(null);
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const getCapturedFile = () => {
    if (currentCapturedImage) {
      const blob = dataURLtoBlob(currentCapturedImage);
      return new File([blob], `sales-activity-${Date.now()}.jpg`, { type: 'image/jpeg' });
    }
    return null;
  };

  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="result-modal-title"
      aria-describedby="result-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '500px', md: '600px' },
          maxWidth: '90vw',
          bgcolor: 'background.paper',
          borderRadius: { xs: '16px', sm: '18px', md: '20px' },
          boxShadow: '0 25px 50px -12px rgba(107, 163, 208, 0.15), 0 0 0 1px rgba(107, 163, 208, 0.08)',
          p: { xs: 3, sm: 4 },
          maxHeight: '75vh',
          overflow: 'auto',
          border: '1px solid rgba(107, 163, 208, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Modal Header with Title and Close Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(107, 163, 208, 0.1)',
            background: 'linear-gradient(135deg, rgba(107, 163, 208, 0.02) 0%, rgba(107, 163, 208, 0.01) 100%)',
            borderRadius: '12px 12px 0 0',
            px: 1,
            py: 1,
          }}
        >
          <Typography
            id="result-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              color: '#6BA3D0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AssignmentIcon sx={{
              color: '#6BA3D0',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }} />
            Result
          </Typography>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              color: '#666',
              transition: 'all 0.2s ease',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(107, 163, 208, 0.08)',
                color: '#6BA3D0',
                transform: 'scale(1.05)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Hasil dari aktivitas */}
        <Box sx={{ mb: 3 }}>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="Masukkan hasil aktivitas..."
            value={result}
            onChange={(e) => setResult(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: { xs: '8px', sm: '10px' },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                transition: 'all 0.2s ease',
                '& fieldset': {
                  borderColor: '#ddd',
                  transition: 'border-color 0.2s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#6BA3D0',
                  boxShadow: '0 0 0 2px rgba(107, 163, 208, 0.1)',
                },
                '&.Mui-focused': {
                  '& fieldset': {
                    borderColor: '#6BA3D0',
                    borderWidth: '2px',
                  },
                  boxShadow: '0 0 0 3px rgba(107, 163, 208, 0.15)',
                },
              },
            }}
          />
        </Box>

        {/* Kamera Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 1.5,
              fontWeight: 500,
            }}
          >
            Foto Kegiatan (Opsional):
          </Typography>

          {/* Tombol Buka Kamera */}
          {!cameraActive && !currentCapturedImage && (
            <Button
              variant="outlined"
              onClick={openCamera}
              startIcon={<CameraAltIcon />}
              sx={{
                mb: 2,
                borderColor: '#6BA3D0',
                color: '#6BA3D0',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#5a8fb8',
                  backgroundColor: 'rgba(107, 163, 208, 0.04)',
                },
              }}
            >
              Buka Kamera
            </Button>
          )}

          {/* Error Message */}
          {cameraError && (
            <Typography
              variant="body2"
              sx={{
                color: 'error.main',
                mb: 2,
                fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
              }}
            >
              {cameraError}
            </Typography>
          )}

          {/* Webcam Preview */}
          {cameraActive && (
            <Box sx={{ mb: 2 }}>
              <Webcam
                key={`webcam-${openModal}`} // Key untuk force re-mount saat modal dibuka
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: 'auto',
                  borderRadius: '8px',
                  border: '2px solid #6BA3D0',
                }}
                onUserMedia={(stream) => {
                  console.log('Webcam ready');
                  streamRef.current = stream;
                  setIsWebcamReady(true);
                  setCameraError(null);
                }}
                onUserMediaError={(error) => {
                  console.error('Webcam error:', error);
                  setCameraError('Tidak dapat mengakses kamera');
                  setCameraActive(false);
                  setIsWebcamReady(false);
                  cleanupWebcam();
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={capturePhoto}
                  disabled={!isWebcamReady}
                  startIcon={<PhotoCameraIcon />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: { xs: '6px', sm: '8px' },
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666',
                    },
                  }}
                >
                  {isWebcamReady ? 'Ambil Foto' : 'Menyiapkan Kamera...'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={closeCamera}
                  sx={{
                    borderColor: '#f44336',
                    color: '#f44336',
                    borderRadius: { xs: '6px', sm: '8px' },
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      backgroundColor: 'rgba(244, 67, 54, 0.04)',
                    },
                  }}
                >
                  Batal
                </Button>
              </Box>
            </Box>
          )}

          {/* Preview Captured Image */}
          {currentCapturedImage && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
                  color: '#666',
                  mb: 1,
                }}
              >
                Preview Foto:
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={currentCapturedImage}
                  alt="Captured"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '2px solid #6BA3D0',
                  }}
                />
                <IconButton
                  onClick={removeCapturedImage}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#f44336',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    width: 32,
                    height: 32,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Canvas untuk capture (hidden) */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Save Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleSaveResult}
          disabled={!result.trim() || saving}
          sx={{
            py: { xs: 1.25, sm: 1.5 },
            fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
            fontWeight: 600,
            backgroundColor: '#6BA3D0',
            background: 'linear-gradient(135deg, #6BA3D0 0%, #5a8fb8 100%)',
            color: 'white',
            borderRadius: { xs: '8px', sm: '10px' },
            textTransform: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(107, 163, 208, 0.2)',
            '&:hover': {
              backgroundColor: '#5a8fb8',
              background: 'linear-gradient(135deg, #5a8fb8 0%, #4a7fa8 100%)',
              color: 'white',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(107, 163, 208, 0.3)',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
              background: '#ccc',
              color: '#666',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Result'}
        </Button>
      </Box>
    </Modal>
  );
}
