import React, { useState, useRef, useEffect } from 'react';
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
  // State untuk kamera
  const [cameraActive, setCameraActive] = useState(false);
  const [localCapturedImage, setLocalCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Gunakan capturedImage dari props jika tersedia, atau local state
  const currentCapturedImage = capturedImage !== undefined ? capturedImage : localCapturedImage;
  const setCurrentCapturedImage = setCapturedImage !== undefined ? setCapturedImage : setLocalCapturedImage;

  // Refs untuk kamera dan canvas
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup kamera saat component unmount
  useEffect(() => {
    return () => {
      if (cameraActive) {
        setCameraActive(false);
      }
    };
  }, []);

  // Fungsi untuk membuka kamera
  const openCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);
    } catch (error) {
      console.error('Error opening camera:', error);
      setCameraError('Tidak dapat mengakses kamera');
    }
  };

  // Fungsi untuk menutup kamera
  const closeCamera = () => {
    setCameraActive(false);
    setCurrentCapturedImage(null);
    setCameraError(null);
  };

  // Fungsi untuk kompres gambar
  const compressImage = (base64Image, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Hitung dimensi baru dengan mempertahankan aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Buat canvas untuk kompresi
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Kompres menjadi base64 dengan quality yang ditentukan
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = base64Image;
    });
  };

  // Fungsi untuk capture foto
  const capturePhoto = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          // Kompres gambar sebelum simpan
          const compressedImage = await compressImage(imageSrc, 640, 0.20); // 640px max, 50% quality
          setCurrentCapturedImage(compressedImage);
          setCameraActive(false);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Fallback ke gambar asli jika kompresi gagal
          setCurrentCapturedImage(imageSrc);
          setCameraActive(false);
        }
      }
    }
  };

  // Fungsi untuk menghapus foto yang sudah di-capture
  const removeCapturedImage = () => {
    setCurrentCapturedImage(null);
  };

  // Fungsi untuk convert base64 ke Blob
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

  // Fungsi untuk mendapatkan file dari captured image
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
          boxShadow: 24,
          p: { xs: 3, sm: 4 },
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Modal Header with Title and Close Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            id="result-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              color: '#333',
            }}
          >

          </Typography>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#333',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Hasil dari aktivitas */}
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
            Result :
          </Typography>
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
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#6BA3D0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6BA3D0',
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
            Foto Kegiatan (Opsional - Frontend Only):
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
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: { ideal: 'environment' }, // Prioritas kamera belakang
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
                onUserMediaError={(error) => {
                  console.error('Webcam error:', error);
                  setCameraError('Tidak dapat mengakses kamera');
                  setCameraActive(false);
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={capturePhoto}
                  startIcon={<PhotoCameraIcon />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: { xs: '6px', sm: '8px' },
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                  }}
                >
                  Ambil Foto
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
            color: 'white',
            borderRadius: { xs: '8px', sm: '10px' },
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#5a8fb8',
              color: 'white',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
              color: '#666',
            },
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Result'}
        </Button>
      </Box>
    </Modal>
  );
}
