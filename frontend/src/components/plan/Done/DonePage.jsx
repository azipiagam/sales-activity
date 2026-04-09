import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { parse, isValid } from 'date-fns';
import { apiRequest } from '../../../services/api';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';
import HeaderDone from './HeaderDone';
import MapsDone from './MapsDone';
import CameraDone from './CameraDone';
import CardDone from './CardDone';

const normalizeTaskId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
};

export default function DonePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [autoLocateAttempted, setAutoLocateAttempted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const { invalidateCache, fetchPlansByDate, updatePlanInCache } = useActivityPlans();

  const taskId = useMemo(() => {
    const sourceTaskId = location.state?.taskId ?? searchParams.get('taskId');
    return normalizeTaskId(sourceTaskId);
  }, [location.state, searchParams]);

  const dateToUse = useMemo(() => {
    const sourceDate = location.state?.date ?? searchParams.get('date');
    if (!sourceDate) return new Date();

    const parsedDate = parse(sourceDate, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : new Date();
  }, [location.state, searchParams]);

  const taskData = location.state?.task;
  const taskName = taskData?.namaCustomer;
  const planNo = taskData?.idPlan ?? taskData?.plan_no ?? '';
  const tujuan = taskData?.tujuan ?? '';

  useEffect(() => {
    setAutoLocateAttempted(false);
    setCurrentLocation(null);
    setCameraActive(false);
  }, [taskId]);

  const handleBackToPlan = () => {
    navigate('/plan', { replace: true });
  };

  const handleOpenCamera = () => {
    setCameraActive(true);
  };

  const handleCameraCapture = (imageData) => {
    setCapturedImage(imageData);
    setCameraActive(false);
  };

  const handleCloseCamera = () => {
    setCameraActive(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { getAccurateLocation } = await import('../../../utils/geocoding');
      const locationData = await getAccurateLocation({
        desiredAccuracy: 100,
        maxRetries: 2,
      });

      if (!locationData?.latitude || !locationData?.longitude) {
        throw new Error('Koordinat GPS tidak valid. Silakan coba lagi.');
      }

      setCurrentLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy ?? null,
      });
    } catch (err) {
      console.error('Error getting current location:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapLocationChange = (lat, lng) => {
    setCurrentLocation((prev) => ({
      ...(prev || {}),
      latitude: lat,
      longitude: lng,
    }));
  };

  useEffect(() => {
    if (taskId && !autoLocateAttempted && !currentLocation && !locationLoading) {
      setAutoLocateAttempted(true);
      handleGetCurrentLocation();
    }
  }, [taskId, autoLocateAttempted, currentLocation, locationLoading]);

  const handleSaveResult = async () => {
    if (!taskId) return;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      alert('Silakan ambil lokasi saat ini terlebih dahulu.');
      return;
    }

    try {
      setSaving(true);

      const resultText = result.trim() || '-';

      updatePlanInCache(taskId, {
        status: 'done',
        result: resultText,
        result_location_lat: currentLocation.latitude,
        result_location_lng: currentLocation.longitude,
        result_location_accuracy: currentLocation.accuracy,
        result_saved_at: new Date().toISOString(),
      });

      const response = await apiRequest(`activity-plans/${taskId}/done`, {
        method: 'PUT',
        body: JSON.stringify({
          result: resultText,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          photo: capturedImage || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        invalidateCache(dateToUse);
        await fetchPlansByDate(dateToUse, true);
        throw new Error(errorData.message || 'Failed to save result');
      }

      invalidateCache(dateToUse);
      fetchPlansByDate(dateToUse, true).catch((err) => {
        console.error('Error refreshing after done:', err);
      });

      handleBackToPlan();
    } catch (err) {
      console.error('Error saving result:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!taskId) {
    return (
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#333',
            mb: 1,
          }}
        >
          Data task tidak ditemukan
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#666',
            mb: 2,
          }}
        >
          Buka ulang dari tombol Done pada Active Task.
        </Typography>
        <Button variant="contained" onClick={handleBackToPlan} sx={{ textTransform: 'none' }}>
          Kembali ke Plan
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <HeaderDone
        onBack={handleBackToPlan}
        taskName={taskName}
        planNo={planNo}
        tujuan={tujuan}
        onRefreshLocation={handleGetCurrentLocation}
        showRefreshLocation={Boolean(currentLocation)}
        refreshLoading={locationLoading}
        refreshDisabled={locationLoading || saving}
      />

      {cameraActive ? (
        <CameraDone saving={saving} onCapture={handleCameraCapture} onCancel={handleCloseCamera} />
      ) : (
        <MapsDone
          currentLocation={currentLocation}
          locationLoading={locationLoading}
          saving={saving}
          onGetCurrentLocation={handleGetCurrentLocation}
          onMapLocationChange={handleMapLocationChange}
        />
      )}

      {!cameraActive ? (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            px: { xs: 0, md: 3 },
            pointerEvents: 'none',
          }}
        >
          <Paper
            sx={{
              pointerEvents: 'auto',
              mx: 'auto',
              width: '100%',
              maxWidth: 920,
              minHeight: { xs: '35dvh', sm: '36dvh', md: 340 },
              maxHeight: { xs: '54dvh', sm: '55dvh', md: 460 },
              pt: { xs: 1.75, sm: 2.25 },
              px: { xs: 2, sm: 2.5 },
              pb: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
              borderRadius: { xs: '24px 24px 0 0', sm: '26px 26px 0 0' },
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderBottom: 'none',
              backgroundColor: '#f6f6f6',
              boxShadow: '0 -14px 34px rgba(11, 30, 56, 0.2)',
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
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
                mx: 'auto',
                mb: 1.5,
                flexShrink: 0,
              }}
            />

            {!currentLocation ? (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#d32f2f',
                  fontWeight: 600,
                  mb: 1.5,
                }}
              >
                Lokasi belum tersedia. Gunakan tombol refresh di header atau Ambil Lokasi Saat Ini pada area map.
              </Typography>
            ) : null}

            <CardDone
              result={result}
              onResultChange={setResult}
              capturedImage={capturedImage}
              onOpenCamera={handleOpenCamera}
              onRemoveImage={() => setCapturedImage(null)}
              disabled={saving}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleSaveResult}
              disabled={saving || !currentLocation}
              sx={{
                mt: 'auto',
                pt: 2,
                minHeight: 52,
                textTransform: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.05rem' },
                color: '#fff',
                background:
                  'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
                },
              }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Done'}
            </Button>
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
}
