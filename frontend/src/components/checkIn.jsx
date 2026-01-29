// React
import React, { useState, useCallback, useRef, useEffect } from 'react';

// Material-UI Components
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import TextareaAutosize from '@mui/material/TextareaAutosize';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MapIcon from '@mui/icons-material/Map';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';

// Google Maps components
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// Webcam component
import Webcam from 'react-webcam';

// Custom imports
import { apiRequest } from '../config/api';

export default function CheckIn({ open, onClose }) {
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
  const [showMap, setShowMap] = useState(false);

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Address loading state
  const [addressLoading, setAddressLoading] = useState(false);

  // Refs untuk kamera
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

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
    setCapturedImage(null);
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
          const compressedImage = await compressImage(imageSrc, 640, 0.20); // 640px max, 20% quality
          setCapturedImage(compressedImage);
          setCameraActive(false);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Fallback ke gambar asli jika kompresi gagal
          setCapturedImage(imageSrc);
          setCameraActive(false);
        }
      }
    }
  };

  // Fungsi untuk menghapus foto yang sudah di-capture
  const removeCapturedImage = () => {
    setCapturedImage(null);
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
    if (capturedImage) {
      const blob = dataURLtoBlob(capturedImage);
      return new File([blob], `check-in-${Date.now()}.jpg`, { type: 'image/jpeg' });
    }
    return null;
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
    setShowMap(false);
    setCameraActive(false);
    setCapturedImage(null);
    setCameraError(null);
    setAddressLoading(false);
    onClose();
  }, [onClose]);

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
  }, [location, address, city, state, result, capturedImage, handleClose]);


  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '90vh',
        },
      }}
    >
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
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              color: '#333',
            }}
          >
            Check In
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
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
            Lokasi Saat Ini
          </Typography>

          {/* Get Location Button */}
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
              borderColor: '#6BA3D0',
              color: '#6BA3D0',
              borderRadius: { xs: '8px', sm: '10px' },
              textTransform: 'none',
              mb: 2,
              '&:hover': {
                borderColor: '#5a8fb8',
                backgroundColor: 'rgba(107, 163, 208, 0.08)',
              },
              '&:disabled': {
                borderColor: '#ccc',
                color: '#ccc',
              },
            }}
          >
            {addressLoading ? 'Mengambil Lokasi...' : 'Ambil Lokasi Saat Ini'}
          </Button>

          {/* Location Display */}
          {location && (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                backgroundColor: 'rgba(107, 163, 208, 0.04)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon sx={{ fontSize: '1.25rem', color: '#6BA3D0', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Koordinat: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Typography>
              </Box>
              {addressLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={14} sx={{ color: '#6BA3D0', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Mengambil alamat...
                  </Typography>
                </Box>
              ) : address ? (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Alamat: {address}
                </Typography>
              ) : null}

              {/* Map Toggle Button */}
              <Button
                variant="text"
                size="small"
                onClick={() => setShowMap(!showMap)}
                startIcon={<MapIcon />}
                sx={{
                  mt: 1,
                  p: 0,
                  fontSize: '0.75rem',
                  color: '#6BA3D0',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
              </Button>
            </Box>
          )}

          {/* Map Display */}
          {location && showMap && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#666',
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Peta Lokasi
              </Typography>
              <Box
                sx={{
                  height: '250px',
                  width: '100%',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <LoadScript googleMapsApiKey="AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg">
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={{
                      lat: location.latitude,
                      lng: location.longitude
                    }}
                    zoom={15}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <Marker
                      position={{
                        lat: location.latitude,
                        lng: location.longitude
                      }}
                      title="Lokasi Check-in"
                    />
                  </GoogleMap>
                </LoadScript>
              </Box>
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
            Hasil Check In
          </Typography>
          <TextareaAutosize
            minRows={3}
            placeholder="Masukkan hasil check in..."
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
              e.target.style.borderColor = '#6BA3D0';
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
            Foto Check In (Opsional):
          </Typography>

          {/* Tombol Buka Kamera */}
          {!cameraActive && !capturedImage && (
            <Button
              variant="outlined"
              onClick={openCamera}
              disabled={success}
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
                  borderColor: '#6BA3D0',
                  color: '#6BA3D0',
                  borderRadius: { xs: '8px', sm: '10px' },
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#5a8fb8',
                    backgroundColor: 'rgba(107, 163, 208, 0.08)',
                  },
                }}
              >
                Tutup
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
                  backgroundColor: '#6BA3D0',
                  color: 'white',
                  borderRadius: { xs: '8px', sm: '10px' },
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#5a8fb8',
                    color: 'white',
                  },
                  '&:disabled': {
                    backgroundColor: '#6BA3D0',
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

    </Drawer>
  );
}
