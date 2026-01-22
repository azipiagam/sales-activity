import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';

// Material-UI Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getAccurateLocation, getApproximateLocation, getEnhancedAddressFromCoordinates } from '../utils/geocoding';

export default function LocationHelper({
  open,
  onClose,
  onLocationSelect,
  title = "Dapatkan Lokasi",
  desiredAccuracy = 100,
  showApproximateOption = true
}) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showApproximateDialog, setShowApproximateDialog] = useState(false);

  const resetState = useCallback(() => {
    setLoading(false);
    setProgress('');
    setCurrentLocation(null);
    setAddress('');
    setError('');
    setAttempts(0);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const getAccuracyColor = (accuracy) => {
    if (accuracy <= 50) return 'success';
    if (accuracy <= 100) return 'info';
    if (accuracy <= 200) return 'warning';
    return 'error';
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy <= 50) return 'Sangat Akurat';
    if (accuracy <= 100) return 'Akurat';
    if (accuracy <= 200) return 'Cukup Akurat';
    if (accuracy <= 500) return 'Kurang Akurat';
    return 'Tidak Akurat';
  };

  const getLocationQuality = (accuracy, method) => {
    const isApproximateMethod = method === 'ip_based' || method === 'network_based';
    const isPoorAccuracy = accuracy > 500;

    if (isApproximateMethod) return 'approximate';
    if (isPoorAccuracy) return 'poor';
    if (accuracy <= desiredAccuracy) return 'good';
    return 'fair';
  };

  const handleGetAccurateLocation = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress('Memulai pencarian lokasi...');
    setAttempts(0);

    try {
      const locationData = await getAccurateLocation({
        desiredAccuracy,
        maxRetries: 3,
        onProgress: (message) => {
          setProgress(message);
        },
        onRetry: (position, attempt, max) => {
          setAttempts(attempt);
          setCurrentLocation({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            method: position.strategy.name,
            isAccurate: false
          });
          setProgress(`Mencoba lagi (${attempt}/${max}) - Akurasi saat ini: ${Math.round(position.accuracy)}m`);
        }
      });

      setCurrentLocation(locationData);

      // Get address for the location
      setProgress('Mendapatkan alamat...');
      const addressData = await getEnhancedAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude,
        { accuracy: locationData.accuracy }
      );

      setAddress(addressData.city); // Use city name instead of full address
      setProgress('Lokasi berhasil didapatkan!');

      // Auto-select if accuracy is good
      const quality = getLocationQuality(locationData.accuracy, locationData.method);
      if (quality === 'good' && onLocationSelect) {
        setTimeout(() => {
          onLocationSelect({
            ...locationData,
            address: addressData.address,
            addressSource: addressData.source,
            isApproximate: addressData.isApproximate
          });
          handleClose();
        }, 1500);
      }

    } catch (err) {
      console.error('Location error:', err);
      setError(err.message);

      // Show approximate location option if available
      if (showApproximateOption && err.message.includes('metode apapun')) {
        setShowApproximateDialog(true);
      }
    } finally {
      setLoading(false);
    }
  }, [desiredAccuracy, showApproximateOption, onLocationSelect, handleClose]);

  const handleGetApproximateLocation = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress('Mencari lokasi perkiraan...');
    setShowApproximateDialog(false);

    try {
      const locationData = await getApproximateLocation({
        onProgress: (message) => {
          setProgress(message);
        }
      });

      setCurrentLocation(locationData);

      // Get address for the approximate location
      setProgress('Mendapatkan alamat perkiraan...');
      const addressData = await getEnhancedAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude,
        { accuracy: locationData.accuracy }
      );

      setAddress(addressData.address);
      setProgress('Lokasi perkiraan berhasil didapatkan!');

    } catch (err) {
      console.error('Approximate location error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectLocation = useCallback(() => {
    if (currentLocation && onLocationSelect) {
      onLocationSelect({
        ...currentLocation,
        address,
        addressSource: 'mixed',
        isApproximate: !currentLocation.isAccurate
      });
      handleClose();
    }
  }, [currentLocation, address, onLocationSelect, handleClose]);

  const handleRetry = useCallback(() => {
    resetState();
    handleGetAccurateLocation();
  }, [resetState, handleGetAccurateLocation]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px', sm: '20px' },
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
            {title}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {/* Progress/Error Messages */}
          {loading && progress && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                {progress}
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Current Location Display */}
          {currentLocation && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                backgroundColor: 'rgba(107, 163, 208, 0.04)'
              }}>
                {/* Accuracy Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    icon={currentLocation.accuracy <= desiredAccuracy ?
                      <CheckCircleIcon /> : <WarningIcon />}
                    label={`${getAccuracyLabel(currentLocation.accuracy)} (${Math.round(currentLocation.accuracy)}m)`}
                    color={getAccuracyColor(currentLocation.accuracy)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {currentLocation.method.replace('_', ' ')}
                  </Typography>
                </Box>

                {/* Coordinates */}
                <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
                  📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Typography>

                {/* Address */}
                {address && (
                  <Typography variant="body2" color="text.secondary">
                    🏠 {address}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {!loading && !currentLocation && (
              <Button
                variant="contained"
                onClick={handleGetAccurateLocation}
                startIcon={<GpsFixedIcon />}
                sx={{
                  backgroundColor: '#6BA3D0',
                  '&:hover': { backgroundColor: '#5a8fb8' }
                }}
              >
                Dapatkan Lokasi Akurat
              </Button>
            )}

            {currentLocation && !loading && (
              <>
                <Button
                  variant="contained"
                  onClick={handleSelectLocation}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    '&:hover': { backgroundColor: '#45a049' }
                  }}
                >
                  Gunakan Lokasi Ini
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: '#6BA3D0',
                    color: '#6BA3D0',
                    '&:hover': {
                      borderColor: '#5a8fb8',
                      backgroundColor: 'rgba(107, 163, 208, 0.08)'
                    }
                  }}
                >
                  Coba Lagi
                </Button>
              </>
            )}

            {loading && (
              <Button disabled startIcon={<CircularProgress size={20} />}>
                {progress || 'Mencari lokasi...'}
              </Button>
            )}
          </Box>

          {/* Tips */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: '8px' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Tips untuk akurasi lokasi yang lebih baik:
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
              • Pastikan GPS aktif dan tidak ada gangguan sinyal
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
              • Coba di area terbuka atau dekat jendela
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
              • Tunggu beberapa saat untuk mendapatkan sinyal GPS
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approximate Location Dialog */}
      <Dialog
        open={showApproximateDialog}
        onClose={() => setShowApproximateDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Lokasi Tidak Ditemukan
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tidak dapat mendapatkan lokasi GPS yang akurat. Apakah Anda ingin mencoba mendapatkan lokasi perkiraan?
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Lokasi perkiraan menggunakan IP address atau jaringan seluler dan kurang akurat (hingga 5km).
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowApproximateDialog(false)}>
            Batal
          </Button>
          <Button
            onClick={handleGetApproximateLocation}
            variant="contained"
            startIcon={<GpsNotFixedIcon />}
            sx={{
              backgroundColor: '#FF9800',
              '&:hover': { backgroundColor: '#F57C00' }
            }}
          >
            Dapatkan Lokasi Perkiraan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
