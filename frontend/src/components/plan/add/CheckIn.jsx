// React
import React, { useState, useCallback, useEffect } from 'react';

// Material-UI Components
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Material-UI Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

// Custom imports
import { apiRequest } from '../../../services/api';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';
import CameraDone from '../Done/CameraDone';

export default function CheckIn({ open, onClose, onOpenAddPlan, onOpenNavigation }) {
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [result, setResult] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // Address loading state
  const [addressLoading, setAddressLoading] = useState(false);

  const { invalidateCache, fetchPlansByDate } = useActivityPlans();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Get current location directly
  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini');
      return;
    }

    setAddressLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Set location immediately
        setLocation({
          latitude,
          longitude
        });

        // Get address using reverse geocoding
        await getAddressFromCoordinates(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Gagal mendapatkan lokasi';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Waktu mendapatkan lokasi habis.';
            break;
        }

        setError(errorMessage);
        setAddressLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);


  // Auto fetch lokasi saat drawer dibuka
  useEffect(() => {
    if (open && !location && !addressLoading && !loading && !success) {
      handleGetCurrentLocation();
    }
  }, [open, location, addressLoading, loading, success, handleGetCurrentLocation]);


  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    try {
      console.log('Reverse geocoding started for:', lat, lng);

      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sales-Activity-App/1.0',
          },
        }
      );

      console.log('Nominatim response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Nominatim response data:', data);

      if (data && data.display_name) {
        setAddress(data.display_name);
        const addressData = data.address || {};
        const cityValue =
          addressData.city ||
          addressData.town ||
          addressData.village ||
          addressData.municipality ||
          addressData.suburb ||
          addressData.county ||
          '';
        const stateValue = addressData.state || addressData.region || '';
        setCity(cityValue);
        setState(stateValue);
        console.log('Address set to:', data.display_name);
      } else {
        console.warn('No display_name in response, using coordinates as fallback');
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setCity('');
        setState('');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      console.log('Falling back to coordinates only');
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCity('');
      setState('');
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // Cleanup kamera saat component unmount
  useEffect(() => {
    return () => {
      if (cameraActive) {
        setCameraActive(false);
      }
    };
  }, []);

  // Fungsi untuk membuka kamera
  const openCamera = () => {
    setCameraError('');
    setCameraActive(true);
  };

  // Fungsi untuk menutup kamera
  const closeCamera = () => {
    setCameraActive(false);
    setCapturedImage(null);
    setCameraError('');
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

  const handleCameraCapture = async (imageData) => {
    if (!imageData) return;
    try {
      const compressedImage = await compressImage(imageData, 640, 0.20); // 640px max, 20% quality
      setCapturedImage(compressedImage);
    } catch (error) {
      console.error('Error compressing image:', error);
      setCapturedImage(imageData);
    } finally {
      setCameraError('');
      setCameraActive(false);
    }
  };

  // Fungsi untuk menghapus foto yang sudah di-capture
  const removeCapturedImage = () => {
    setCapturedImage(null);
  };

  const handleClose = useCallback(() => {
    setLocation(null);
    setAddress('');
    setCity('');
    setState('');
    setResult('');
    setError('');
    setSuccess(false);
    setCheckInResult(null);
    setLoading(false);
    setCameraActive(false);
    setCapturedImage(null);
    setCameraError('');
    setAddressLoading(false);
    onClose();
  }, [onClose]);

  const handleSwitchToAddPlan = useCallback(() => {
    handleClose();
    if (onOpenAddPlan) onOpenAddPlan();
  }, [handleClose, onOpenAddPlan]);

  // Handle check-in process
  const handleCheckIn = useCallback(async () => {
    if (!location) {
      setError('Lokasi belum didapatkan. Silakan ambil lokasi terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');
    setCheckInResult(null);

    try {
      // Ensure we have an address, fallback to coordinates if reverse geocoding failed
      const finalAddress = address && address.trim() ? address : `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

      const checkInData = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: finalAddress,
        city: city || '',
        state: state || '',
        result: result,
        timestamp: new Date().toISOString(),
        capturedImage: capturedImage,
      };

      // Call check-in API endpoint
      const response = await apiRequest('check-in', {
        method: 'POST',
        body: JSON.stringify(checkInData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal melakukan check-in');
      }

      const responseData = await response.json();
      setCheckInResult({
        success: true,
        message: 'Check-in berhasil!',
        data: responseData.data,
      });
      setSuccess(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        invalidateCache(today);
        await fetchPlansByDate(today, true);
      } catch (refreshError) {
        console.error('Error refreshing data after check-in:', refreshError);
      }
      window.dispatchEvent(new CustomEvent('activityPlanCreated', {
        detail: { source: 'check-in', date: today.toISOString(), checkInData: responseData.data }
      }));

      handleClose();
    } catch (error) {
      console.error('Error during check-in:', error);
      setCheckInResult({
        success: false,
        message: error.message || 'Terjadi kesalahan saat check-in',
      });
      setError(error.message || 'Terjadi kesalahan saat check-in');
    } finally {
      setLoading(false);
    }
  }, [location, address, city, state, result, capturedImage, invalidateCache, fetchPlansByDate, handleClose]);


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      scroll="paper"
      sx={{
        '& .MuiDialog-container': {
          alignItems: fullScreen ? 'center' : 'flex-end',
        },
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: fullScreen ? 0 : '20px',
          borderTopRightRadius: fullScreen ? 0 : '20px',
          maxHeight: fullScreen ? '100%' : '90vh',
          width: '100%',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            padding: { xs: 2, sm: 3, md: 4 },
            maxWidth: { xs: '100%', sm: '600px', md: '700px' },
            margin: '0 auto',
            width: '100%',
          }}
        >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(31, 78, 140, 0.1)',
            gap: 1,
          }}
        >
          <IconButton
            onClick={onOpenNavigation || onClose}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                fontWeight: 700,
                color: 'var(--theme-blue-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flex: 1,
              }}
            >
            <PersonSearchIcon sx={{ color: 'var(--theme-blue-primary)' }} />
            Prospek
          </Typography>
        </Box>

        {/* Error Message */}
        {error && !checkInResult && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Success Message */}
        {success && checkInResult && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">
              {checkInResult.message}
            </Alert>
          </Box>
        )}

        {/* Location Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 2,
              fontWeight: 600,
            }}
          >
            Current Location
          </Typography>

          {/* Get Location Button (optional refresh) */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGetCurrentLocation}
            disabled={loading || addressLoading || success}
            startIcon={addressLoading ? <CircularProgress size={20} /> : <LocationOnIcon />}
            sx={{
              py: { xs: 1.5, sm: 1.75 },
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              fontWeight: 600,
              borderColor: 'var(--theme-blue-primary)',
              color: 'var(--theme-blue-primary)',
              borderRadius: { xs: '8px', sm: '10px' },
              textTransform: 'none',
              mb: 2,
              '&:hover': {
                borderColor: 'var(--theme-blue-overlay)',
                backgroundColor: 'rgba(31, 78, 140, 0.08)',
              },
              '&:disabled': {
                borderColor: '#ccc',
                color: '#ccc',
              },
            }}
          >
            {addressLoading ? 'Mengambil Lokasi...' : 'Perbarui Lokasi'}
          </Button>

          {/* Location Display */}
          {location && (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                backgroundColor: 'rgba(31, 78, 140, 0.04)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon sx={{ fontSize: '1.25rem', color: 'var(--theme-blue-primary)', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Koordinat: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Typography>
              </Box>
              {addressLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={14} sx={{ color: 'var(--theme-blue-primary)', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Mengambil alamat...
                  </Typography>
                </Box>
              ) : address ? (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Address: {address}
                </Typography>
              ) : null}

            </Box>
          )}


        </Box>

        {/* Result Input */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 1,
              fontWeight: 600,
            }}
          >
            Check-in Result
          </Typography>
          <TextareaAutosize
            minRows={5}
            placeholder="Enter check-in result..."
            value={result}
            onChange={(e) => setResult(e.target.value)}
            disabled={success}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '8px',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--theme-blue-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
            }}
          />
        </Box>

        {/* Camera Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 1.5,
              fontWeight: 600,
            }}
          >
            Check In Photo (Optional):
          </Typography>

          {/* Tombol Buka Kamera */}
          {!cameraActive && (
            <Button
              variant="text"
              onClick={openCamera}
              disabled={success || loading}
              startIcon={<PhotoCameraIcon />}
              endIcon={<ChevronRightRoundedIcon />}
              sx={{
                px: 0.35,
                py: 1.05,
                width: '100%',
                justifyContent: 'space-between',
                color: '#1b3557',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'none',
                '& .MuiButton-startIcon': {
                  color: '#1f4e8c',
                  mr: 1.3,
                },
                '& .MuiButton-endIcon': {
                  color: '#94a8bf',
                  ml: 1.3,
                },
                '&:hover': {
                  backgroundColor: 'rgba(31, 78, 140, 0.06)',
                },
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                Take a selfie (optional)
              </Box>
            </Button>
          )}
          {!cameraActive && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#7d90a8',
                fontSize: '0.74rem',
                ml: 0.6,
                mt: -0.2,
                mb: 0.8,
              }}
            >
              As proof of visit
            </Typography>
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

          {/* Camera Preview (same flow as Done page) */}
          {cameraActive && (
            <Box sx={{ mb: 2 }}>
              <CameraDone
                saving={loading}
                onCapture={handleCameraCapture}
                onCameraErrorChange={setCameraError}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
          {capturedImage && (
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
                  src={capturedImage}
                  alt="Captured"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '2px solid var(--theme-blue-primary)',
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
        </Box>

        {/* Check-in Result */}
        {checkInResult && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#666',
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                Hasil Check In
              </Typography>

              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: checkInResult.success ? 'success.main' : 'error.main',
                  borderRadius: '8px',
                  backgroundColor: checkInResult.success
                    ? 'rgba(76, 175, 80, 0.08)'
                    : 'rgba(244, 67, 54, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {checkInResult.success ? (
                    <CheckCircleIcon sx={{ fontSize: '1.25rem', color: 'success.main', mr: 1 }} />
                  ) : (
                    <ErrorIcon sx={{ fontSize: '1.25rem', color: 'error.main', mr: 1 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: checkInResult.success ? 'success.main' : 'error.main'
                    }}
                  >
                    {checkInResult.message}
                  </Typography>
                </Box>

                {checkInResult.data && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Waktu: {new Date(checkInResult.data.timestamp || Date.now()).toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1.5, sm: 2 },
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {success ? null : (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleClose}
                disabled={loading}
                sx={{
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  borderColor: 'var(--theme-blue-primary)',
                  color: 'var(--theme-blue-primary)',
                  borderRadius: { xs: '8px', sm: '10px' },
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'var(--theme-blue-overlay)',
                    backgroundColor: 'rgba(31, 78, 140, 0.08)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCheckIn}
                disabled={loading || !location}
                sx={{
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  backgroundColor: 'var(--theme-blue-primary)',
                  color: 'white',
                  borderRadius: { xs: '8px', sm: '10px' },
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--theme-blue-overlay)',
                    color: 'white',
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--theme-blue-primary)',
                    opacity: 0.6,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Check In'
                )}
              </Button>
            </>
          )}
        </Box>
      </Box>

      </DialogContent>
    </Dialog>
  );
}

