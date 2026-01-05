// components/ActivityDoneDialog.jsx
// Contoh implementasi complete untuk dialog "Mark Activity as Done"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Divider,
} from '@mui/material';
import { useActivityLocation, formatDistance } from '../hooks/useActivityLocation';
import { formatDistance } from '../utils/activityLocationApi';

/**
 * Component untuk mark activity sebagai done
 * 
 * Props:
 * - open: boolean
 * - onClose: callback ketika dialog ditutup
 * - activityId: string
 * - planLocation: { lat, lng } - lokasi dari activity plan
 * - onSuccess: callback setelah berhasil submit
 * - token: auth token
 */
const ActivityDoneDialog = ({
  open,
  onClose,
  activityId,
  planLocation,
  onSuccess,
  token
}) => {
  // State untuk form
  const [result, setResult] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Custom hook untuk location validation
  const {
    isCheckingDistance,
    isSubmitting,
    distanceData,
    error,
    validateLocation,
    submitActivityDone,
    resetState
  } = useActivityLocation(token);

  /**
   * Get current user location
   */
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung browser ini');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(`Error getting location: ${error.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  /**
   * Handle check location - validasi distance sebelum submit
   */
  const handleCheckLocation = async () => {
    if (!currentLocation) {
      alert('Lokasi belum didapat, silakan klik "Get Location" terlebih dahulu');
      return;
    }

    const locationData = {
      plan_lat: planLocation.lat,
      plan_lng: planLocation.lng,
      current_lat: currentLocation.lat,
      current_lng: currentLocation.lng,
      accuracy: gpsAccuracy
    };

    await validateLocation(activityId, locationData);
  };

  /**
   * Handle submit - mark as done
   */
  const handleSubmit = async () => {
    // Validasi basic
    if (!currentLocation) {
      alert('Lokasi belum didapat');
      return;
    }

    if (!distanceData) {
      alert('Silakan validasi lokasi terlebih dahulu dengan klik "Check Location"');
      return;
    }

    // Jika distance > 200m, result harus ada
    if (distanceData.result_required && !result.trim()) {
      alert('Result field wajib diisi karena jarak > 200 meter');
      return;
    }

    // Prepare payload
    const payload = {
      plan_latitude: planLocation.lat,
      plan_longitude: planLocation.lng,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      accuracy: gpsAccuracy,
      ...(result.trim() && { result: result.trim() })
    };

    // Submit
    const submitResult = await submitActivityDone(activityId, payload);

    if (submitResult.success) {
      // Reset form
      setResult('');
      setCurrentLocation(null);
      setGpsAccuracy(null);
      resetState();

      // Callback success
      onSuccess?.(submitResult);
      
      // Close dialog
      onClose();
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    // Reset state ketika close
    setResult('');
    setCurrentLocation(null);
    setGpsAccuracy(null);
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mark Activity as Done</DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Error Alert */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Location Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📍 Your Location
            </Typography>
            
            {currentLocation ? (
              <Box sx={{ 
                p: 1.5, 
                bgcolor: '#F0F7FF', 
                borderRadius: 1,
                border: '1px solid #6BA3D0'
              }}>
                <Typography variant="body2">
                  Lat: {currentLocation.lat.toFixed(6)}
                </Typography>
                <Typography variant="body2">
                  Lng: {currentLocation.lng.toFixed(6)}
                </Typography>
                {gpsAccuracy && (
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Accuracy: ±{Math.round(gpsAccuracy)}m
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                Location not yet acquired
              </Typography>
            )}

            <Button
              variant="outlined"
              size="small"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              sx={{ mt: 1 }}
              fullWidth
            >
              {isGettingLocation ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Getting Location...
                </>
              ) : (
                'Get Location'
              )}
            </Button>
          </Box>

          <Divider />

          {/* Distance Validation Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📏 Distance Check
            </Typography>

            {distanceData ? (
              <Box sx={{ 
                p: 1.5, 
                bgcolor: distanceData.result_required ? '#FFF3E0' : '#E8F5E9',
                borderRadius: 1,
                border: `1px solid ${distanceData.result_required ? '#FF9800' : '#4CAF50'}`
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Distance: {formatDistance(distanceData.distance)}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: distanceData.result_required ? '#F57C00' : '#2E7D32',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  {distanceData.message}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                Click "Check Distance" to validate
              </Typography>
            )}

            <Button
              variant="outlined"
              size="small"
              onClick={handleCheckLocation}
              disabled={!currentLocation || isCheckingDistance}
              sx={{ mt: 1 }}
              fullWidth
            >
              {isCheckingDistance ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Checking...
                </>
              ) : (
                'Check Distance'
              )}
            </Button>
          </Box>

          <Divider />

          {/* Result Field - Only show if distance > 200m */}
          {distanceData?.result_required && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ⚠️ Result Required (Distance {'>'} 200m)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the result of your activity..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          )}

          {/* Optional Result Field */}
          {distanceData && !distanceData.result_required && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                💬 Result (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add any additional notes..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Box>
          )}

        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !distanceData}
          sx={{
            background: 'linear-gradient(to right, #6BA3D0, #5A92C0)',
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Submitting...
            </>
          ) : (
            'Mark as Done'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityDoneDialog;
