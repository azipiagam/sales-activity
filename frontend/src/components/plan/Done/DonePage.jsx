import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { parse, isValid } from 'date-fns';
import { apiRequest } from '../../../services/api';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';
import { getCustomerAddresses } from '../add/AddCustomerAddress';
import HeaderDone from './HeaderDone';
import MapsDone from './MapsDone';
import CameraDone from './CameraDone';
import CardDone from './CardDone';
import PopupValidationDone from './PopupValidationDone';
import PopupDoneAdditionalAddress from './PopupDone/PopupDoneAdditionalAddress';
import PopupDoneMasterCustomer from './PopupDone/PopupDoneMasterCustomer';

const MASTER_ADDRESS_ID = 'master';
const DISTANCE_LIMIT_KM = 2;
const DEFAULT_CURRENT_ADDRESS = 'Lokasi belum diambil';
const isMasterCustomerSource = (source) => source === 'master' || source === 'fix';

const normalizeTaskId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
};

const normalizeAddressSource = (source, fallbackAddressId) => {
  const normalizedSource = String(source || '').toLowerCase();
  if (normalizedSource === 'custom' || normalizedSource === 'master' || normalizedSource === 'fix') {
    return normalizedSource;
  }

  return String(fallbackAddressId) === MASTER_ADDRESS_ID ? 'master' : 'custom';
};

const getTaskCustomerId = (task) => task?.customer_id ?? task?.customerId ?? '';
const getTaskAddressId = (task) => task?.customer_address_id ?? task?.customerAddressId ?? null;

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  const sourceLat = toFiniteNumber(fromLat);
  const sourceLng = toFiniteNumber(fromLng);
  const targetLat = toFiniteNumber(toLat);
  const targetLng = toFiniteNumber(toLng);

  if (
    sourceLat === null ||
    sourceLng === null ||
    targetLat === null ||
    targetLng === null
  ) {
    return null;
  }

  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(targetLat - sourceLat);
  const dLng = toRadians(targetLng - sourceLng);
  const lat1 = toRadians(sourceLat);
  const lat2 = toRadians(targetLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const resolveValidationAddressReference = (task, addresses = []) => {
  const selectedAddressIdRaw = getTaskAddressId(task);
  const selectedAddressId =
    selectedAddressIdRaw === undefined || selectedAddressIdRaw === null || selectedAddressIdRaw === ''
      ? MASTER_ADDRESS_ID
      : String(selectedAddressIdRaw);

  let selectedAddress = null;
  if (selectedAddressId !== MASTER_ADDRESS_ID) {
    selectedAddress = addresses.find((item) => String(item?.id) === selectedAddressId) || null;
  }

  if (!selectedAddress) {
    selectedAddress =
      addresses.find(
        (item) =>
          String(item?.id) === MASTER_ADDRESS_ID ||
          item?.isDefault ||
          item?.is_default ||
          String(item?.source || '').toLowerCase() === 'master' ||
          String(item?.source || '').toLowerCase() === 'fix'
      ) || null;
  }

  if (!selectedAddress && addresses.length > 0) {
    selectedAddress = addresses[0];
  }

  const referenceSource = normalizeAddressSource(selectedAddress?.source, selectedAddressId);
  const referenceLatitude = toFiniteNumber(
    selectedAddress?.latitude ?? selectedAddress?.lat ?? task?.customer_location_lat ?? task?.customerLocationLat
  );
  const referenceLongitude = toFiniteNumber(
    selectedAddress?.longitude ?? selectedAddress?.lng ?? task?.customer_location_lng ?? task?.customerLocationLng
  );

  return {
    addressId: selectedAddress?.id ?? selectedAddressId,
    source: referenceSource,
    latitude: referenceLatitude,
    longitude: referenceLongitude,
    address: selectedAddress?.address ?? null,
  };
};

const resolveFixAddressConfirmation = (donePayload, task, currentLocation, validationAddressRef) => {
  const hasBackendFlag = typeof donePayload?.needs_fix_address_confirmation === 'boolean';
  const backendDistanceKm = toFiniteNumber(donePayload?.distance_km);

  if (hasBackendFlag) {
    return {
      needsFixAddressConfirmation: donePayload.needs_fix_address_confirmation,
      distanceKm: backendDistanceKm,
    };
  }

  const referenceSource = String(validationAddressRef?.source || '').toLowerCase();
  const customerAddressId = getTaskAddressId(task);
  const fallbackSource = normalizeAddressSource(referenceSource, customerAddressId ?? MASTER_ADDRESS_ID);
  const isCustomAddress = fallbackSource === 'custom';

  if (isCustomAddress) {
    return {
      needsFixAddressConfirmation: false,
      distanceKm: backendDistanceKm,
    };
  }

  const distanceKm = calculateDistanceKm(
    validationAddressRef?.latitude ?? task?.customer_location_lat ?? task?.customerLocationLat,
    validationAddressRef?.longitude ?? task?.customer_location_lng ?? task?.customerLocationLng,
    currentLocation?.latitude,
    currentLocation?.longitude
  );

  if (distanceKm === null) {
    return {
      needsFixAddressConfirmation: false,
      distanceKm: backendDistanceKm,
    };
  }

  return {
    needsFixAddressConfirmation: distanceKm > DISTANCE_LIMIT_KM,
    distanceKm: Number(distanceKm.toFixed(3)),
  };
};

const resolveDistanceToCustomerKm = (task, currentLocation, validationAddressRef) => {
  return calculateDistanceKm(
    validationAddressRef?.latitude ?? task?.customer_location_lat ?? task?.customerLocationLat,
    validationAddressRef?.longitude ?? task?.customer_location_lng ?? task?.customerLocationLng,
    currentLocation?.latitude,
    currentLocation?.longitude
  );
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
  const [currentAddress, setCurrentAddress] = useState(DEFAULT_CURRENT_ADDRESS);
  const [currentLocationRegion, setCurrentLocationRegion] = useState({
    city: '',
    state: '',
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [autoLocateAttempted, setAutoLocateAttempted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [validationAddressRef, setValidationAddressRef] = useState(null);
  const [validationPopup, setValidationPopup] = useState({
    open: false,
    title: 'Informasi',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Batal',
    showCancel: false,
  });
  const [addressValidationPopup, setAddressValidationPopup] = useState({
    open: false,
    addressType: 'master',
    distanceKm: null,
    radiusLimitKm: DISTANCE_LIMIT_KM,
  });
  const validationPopupResolverRef = useRef(null);
  const addressValidationResolverRef = useRef(null);

  const { invalidateCache, fetchPlansByDate, updatePlanInCache, getPlansByDate } = useActivityPlans();

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
  const [taskMeta, setTaskMeta] = useState(taskData ?? null);

  const activeTask = taskMeta ?? taskData ?? null;
  const taskName = activeTask?.namaCustomer ?? activeTask?.customer_name;
  const planNo = activeTask?.idPlan ?? activeTask?.plan_no ?? '';
  const tujuan = activeTask?.tujuan ?? '';

  const closeValidationPopup = useCallback((result) => {
    setValidationPopup((prev) => ({ ...prev, open: false }));
    if (validationPopupResolverRef.current) {
      const pendingResolve = validationPopupResolverRef.current;
      validationPopupResolverRef.current = null;
      pendingResolve(Boolean(result));
    }
  }, []);

  const closeAddressValidationPopup = useCallback((result) => {
    setAddressValidationPopup((prev) => ({ ...prev, open: false }));
    if (addressValidationResolverRef.current) {
      const pendingResolve = addressValidationResolverRef.current;
      addressValidationResolverRef.current = null;
      pendingResolve(Boolean(result));
    }
  }, []);

  const openValidationPopup = useCallback(
    ({
      title,
      message,
      type = 'info',
      confirmText = 'OK',
      cancelText = 'Batal',
      showCancel = false,
    }) => {
      if (validationPopupResolverRef.current) {
        const pendingResolve = validationPopupResolverRef.current;
        validationPopupResolverRef.current = null;
        pendingResolve(false);
      }

      setValidationPopup({
        open: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
      });

      return new Promise((resolve) => {
        validationPopupResolverRef.current = resolve;
      });
    },
    []
  );

  const showValidationAlert = useCallback(
    (message, options = {}) =>
      openValidationPopup({
        title: options.title || 'Informasi',
        message,
        type: options.type || 'info',
        confirmText: options.confirmText || 'Tutup',
        showCancel: false,
      }),
    [openValidationPopup]
  );

  const showValidationConfirm = useCallback(
    (message, options = {}) =>
      openValidationPopup({
        title: options.title || 'Konfirmasi',
        message,
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Lanjutkan',
        cancelText: options.cancelText || 'Batal',
        showCancel: true,
      }),
    [openValidationPopup]
  );

  const showAddressValidationPopup = useCallback(({ addressType, distanceKm }) => {
    if (addressValidationResolverRef.current) {
      const pendingResolve = addressValidationResolverRef.current;
      addressValidationResolverRef.current = null;
      pendingResolve(false);
    }

    const normalizedType = addressType === 'additional' ? 'additional' : 'master';
    const normalizedDistance = Number.isFinite(distanceKm) ? Number(distanceKm) : null;

    setAddressValidationPopup({
      open: true,
      addressType: normalizedType,
      distanceKm: normalizedDistance,
      radiusLimitKm: DISTANCE_LIMIT_KM,
    });

    return new Promise((resolve) => {
      addressValidationResolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    setTaskMeta(taskData ?? null);
  }, [taskData, taskId]);

  useEffect(
    () => () => {
      if (validationPopupResolverRef.current) {
        validationPopupResolverRef.current(false);
        validationPopupResolverRef.current = null;
      }
      if (addressValidationResolverRef.current) {
        addressValidationResolverRef.current(false);
        addressValidationResolverRef.current = null;
      }
    },
    []
  );

  const loadValidationAddressReference = useCallback(async (task) => {
    if (!task) return null;

    const customerId = getTaskCustomerId(task);
    if (!customerId) {
      return resolveValidationAddressReference(task, []);
    }

    try {
      const addresses = await getCustomerAddresses(customerId);
      return resolveValidationAddressReference(task, addresses);
    } catch (err) {
      console.error('Error loading customer addresses for done validation:', err);
      return resolveValidationAddressReference(task, []);
    }
  }, []);

  useEffect(() => {
    setAutoLocateAttempted(false);
    setCurrentLocation(null);
    setCurrentAddress(DEFAULT_CURRENT_ADDRESS);
    setCurrentLocationRegion({ city: '', state: '' });
    setAddressLoading(false);
    setCameraActive(false);
    setValidationAddressRef(null);
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
      await showValidationAlert(`Error: ${err.message}`, {
        title: 'Gagal Mengambil Lokasi',
        type: 'error',
      });
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

  useEffect(() => {
    if (!taskId || taskMeta) return;

    let cancelled = false;

    const hydrateTaskMeta = async () => {
      try {
        let plans = getPlansByDate(dateToUse);
        if (!Array.isArray(plans)) {
          plans = await fetchPlansByDate(dateToUse);
        }

        if (!cancelled && Array.isArray(plans)) {
          const matched = plans.find((plan) => String(plan?.id) === String(taskId));
          if (matched) {
            setTaskMeta(matched);
          }
        }
      } catch (err) {
        console.error('Error loading task metadata:', err);
      }
    };

    hydrateTaskMeta();

    return () => {
      cancelled = true;
    };
  }, [taskId, taskMeta, dateToUse, fetchPlansByDate, getPlansByDate]);

  useEffect(() => {
    if (!activeTask) return;

    let cancelled = false;
    const loadAddressReference = async () => {
      const reference = await loadValidationAddressReference(activeTask);
      if (!cancelled) {
        setValidationAddressRef(reference);
      }
    };

    loadAddressReference();

    return () => {
      cancelled = true;
    };
  }, [activeTask, loadValidationAddressReference]);

  useEffect(() => {
    const latitude = Number(currentLocation?.latitude);
    const longitude = Number(currentLocation?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setCurrentAddress(DEFAULT_CURRENT_ADDRESS);
      setCurrentLocationRegion({ city: '', state: '' });
      setAddressLoading(false);
      return;
    }

    let cancelled = false;

    const resolveAddress = async () => {
      try {
        setAddressLoading(true);
        const { getEnhancedAddressFromCoordinates } = await import('../../../utils/geocoding');
        const resolved = await getEnhancedAddressFromCoordinates(latitude, longitude, {
          accuracy: currentLocation?.accuracy ?? null,
        });

        if (!cancelled) {
          const formattedAddress = String(resolved?.address || '').trim();
          const formattedCity = String(resolved?.city || '').trim();
          const formattedState = String(resolved?.state || '').trim();
          setCurrentAddress(formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setCurrentLocationRegion({
            city: formattedCity,
            state: formattedState,
          });
        }
      } catch (err) {
        console.error('Error resolving current address:', err);
        if (!cancelled) {
          setCurrentAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setCurrentLocationRegion({ city: '', state: '' });
        }
      } finally {
        if (!cancelled) {
          setAddressLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(resolveAddress, 350);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, currentLocation?.accuracy]);

  const handleSaveResult = async () => {
    if (!taskId) return;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      await showValidationAlert('Silakan ambil lokasi saat ini terlebih dahulu.', {
        title: 'Lokasi Belum Tersedia',
        type: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      let currentValidationAddressRef = validationAddressRef;
      if (!currentValidationAddressRef) {
        currentValidationAddressRef = await loadValidationAddressReference(activeTask);
        setValidationAddressRef(currentValidationAddressRef);
      }

      const distanceToCustomerKm = resolveDistanceToCustomerKm(
        activeTask,
        currentLocation,
        currentValidationAddressRef
      );
      const addressSource = normalizeAddressSource(
        currentValidationAddressRef?.source,
        getTaskAddressId(activeTask) ?? MASTER_ADDRESS_ID
      );
      const usesMasterCustomerAddress = isMasterCustomerSource(addressSource);
      const shouldAutoSaveFixAddressFromInitialValidation =
        usesMasterCustomerAddress &&
        Number.isFinite(distanceToCustomerKm) &&
        distanceToCustomerKm > DISTANCE_LIMIT_KM;
      const isProceed = await showAddressValidationPopup({
        addressType: usesMasterCustomerAddress ? 'master' : 'additional',
        distanceKm: distanceToCustomerKm,
      });

      if (!isProceed) {
        return;
      }

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

      const donePayload = await response.json().catch(() => ({}));

      const { needsFixAddressConfirmation, distanceKm } = resolveFixAddressConfirmation(
        donePayload,
        activeTask,
        currentLocation,
        currentValidationAddressRef
      );
      let shouldSaveFixAddress = shouldAutoSaveFixAddressFromInitialValidation;
      if (!shouldSaveFixAddress && needsFixAddressConfirmation) {
        const distanceText =
          distanceKm !== null && Number.isFinite(distanceKm) ? distanceKm.toFixed(2) : null;
        shouldSaveFixAddress = await showValidationConfirm(
          distanceText
            ? `Jarak hasil kunjungan ${distanceText} KM dari koordinat customer (lebih dari ${DISTANCE_LIMIT_KM} KM).\n\nSimpan koordinat saat ini sebagai fix address customer?`
            : `Jarak hasil kunjungan lebih dari ${DISTANCE_LIMIT_KM} KM dari koordinat customer.\n\nSimpan koordinat saat ini sebagai fix address customer?`,
          {
            title: 'Konfirmasi Fix Address',
            type: 'warning',
            confirmText: 'Simpan Fix Address',
            cancelText: 'Lewati',
          }
        );
      }

      if (shouldSaveFixAddress) {
        const customerId = activeTask?.customer_id ?? activeTask?.customerId ?? null;

        if (!customerId) {
          await showValidationAlert(
            'Done berhasil disimpan, tetapi customer ID tidak ditemukan sehingga fix address tidak tersimpan.',
            {
              title: 'Fix Address Tidak Tersimpan',
              type: 'warning',
            }
          );
        } else {
          const normalizedCurrentAddress = String(currentAddress || '').trim();
          const fixAddressPayload = {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            address:
              normalizedCurrentAddress && normalizedCurrentAddress !== DEFAULT_CURRENT_ADDRESS
                ? normalizedCurrentAddress
                : null,
            city: String(currentLocationRegion.city || activeTask?.city || '').trim() || null,
            state: String(currentLocationRegion.state || activeTask?.state || '').trim() || null,
          };

          const fixAddressResponse = await apiRequest(
            `customers/${encodeURIComponent(customerId)}/fix-address`,
            {
              method: 'POST',
              body: JSON.stringify(fixAddressPayload),
            }
          );

          if (!fixAddressResponse.ok) {
            const fixAddressError = await fixAddressResponse.json().catch(() => ({}));
            await showValidationAlert(
              `Done berhasil disimpan, tetapi fix address gagal tersimpan: ${
                fixAddressError.message || 'Unknown error'
              }`,
              {
                title: 'Fix Address Gagal Disimpan',
                type: 'warning',
              }
            );
          }
        }
      }

      invalidateCache(dateToUse);
      fetchPlansByDate(dateToUse, true).catch((err) => {
        console.error('Error refreshing after done:', err);
      });

      handleBackToPlan();
    } catch (err) {
      console.error('Error saving result:', err);
      await showValidationAlert(`Error: ${err.message}`, {
        title: 'Gagal Menyimpan Done',
        type: 'error',
      });
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
        currentAddress={currentAddress}
        addressLoading={addressLoading}
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

      <PopupDoneAdditionalAddress
        open={addressValidationPopup.open && addressValidationPopup.addressType === 'additional'}
        distanceKm={addressValidationPopup.distanceKm}
        radiusLimitKm={addressValidationPopup.radiusLimitKm}
        disableBackdropClose={saving}
        onConfirm={() => closeAddressValidationPopup(true)}
        onCancel={() => closeAddressValidationPopup(false)}
      />

      <PopupDoneMasterCustomer
        open={addressValidationPopup.open && addressValidationPopup.addressType === 'master'}
        distanceKm={addressValidationPopup.distanceKm}
        radiusLimitKm={addressValidationPopup.radiusLimitKm}
        disableBackdropClose={saving}
        onConfirm={() => closeAddressValidationPopup(true)}
        onCancel={() => closeAddressValidationPopup(false)}
      />

      <PopupValidationDone
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        type={validationPopup.type}
        confirmText={validationPopup.confirmText}
        cancelText={validationPopup.cancelText}
        showCancel={validationPopup.showCancel}
        disableBackdropClose={saving}
        onConfirm={() => closeValidationPopup(true)}
        onCancel={() => closeValidationPopup(false)}
      />
    </Box>
  );
}
