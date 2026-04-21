import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { parse, isValid } from 'date-fns';
import { apiRequest } from '../../../services/api';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';
import { getCustomerAddresses } from '../add/AddCustomerAddress';
import HeaderDone from './HeaderDone';
import MapsDone from './MapsDone';
import CameraDone from './CameraDone';
import CardDone from './CardDone';
import ValidateOutRange from './ValidateOutRange';
import PopupValidationDone from './PopupValidationDone';
import SucceedScreen from './SucceedScreen';

const MASTER_ADDRESS_ID = 'master';
const DISTANCE_LIMIT_KM = 2;
const DEFAULT_CURRENT_ADDRESS = 'Lokasi belum diambil';
const ACTIVITY_TYPES = {
  VISIT: 'Visit',
  FOLLOW_UP: 'Follow Up',
};

const normalizeActivityType = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  if (normalized === 'follow up' || normalized === 'follow_up' || normalized === 'followup') {
    return ACTIVITY_TYPES.FOLLOW_UP;
  }
  return ACTIVITY_TYPES.VISIT;
};

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
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
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
  const [cameraError, setCameraError] = useState('');
  const [hasAutoOpenedCamera, setHasAutoOpenedCamera] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(true);
  const [validationAddressRef, setValidationAddressRef] = useState(null);
  const [doneSuccess, setDoneSuccess] = useState(null);
  const [validationPopup, setValidationPopup] = useState({
    open: false,
    title: 'Informasi',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Batal',
    showCancel: false,
  });
  const [outOfRangeDecision, setOutOfRangeDecision] = useState({
    open: false,
    distanceKm: null,
    loading: false,
  });
  const isMountedRef = useRef(true);
  const validationPopupResolverRef = useRef(null);
  const outOfRangeDecisionResolverRef = useRef(null);

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

  useEffect(() => {
    if (!taskId) {
      navigate('/plan', { replace: true });
    }
  }, [taskId, navigate]);

  const activeTask = taskMeta ?? taskData ?? null;
  const taskName = activeTask?.namaCustomer ?? activeTask?.customer_name;
  const planNo = activeTask?.idPlan ?? activeTask?.plan_no ?? '';
  const activityType = useMemo(
    () =>
      normalizeActivityType(
        activeTask?.tujuan ?? activeTask?.activity_type ?? activeTask?.activityType
      ),
    [activeTask]
  );
  const isFollowUp = activityType === ACTIVITY_TYPES.FOLLOW_UP;
  const customerLocation = useMemo(() => {
    const latitude = toFiniteNumber(
      validationAddressRef?.latitude ?? activeTask?.customer_location_lat ?? activeTask?.customerLocationLat
    );
    const longitude = toFiniteNumber(
      validationAddressRef?.longitude ?? activeTask?.customer_location_lng ?? activeTask?.customerLocationLng
    );

    if (latitude === null || longitude === null) return null;

    return { latitude, longitude };
  }, [validationAddressRef, activeTask]);

  const customerAddress = useMemo(() => {
    const formattedAddress = String(validationAddressRef?.address || '').trim();
    if (formattedAddress) return formattedAddress;

    if (customerLocation) {
      return `${customerLocation.latitude.toFixed(6)}, ${customerLocation.longitude.toFixed(6)}`;
    }

    return 'Alamat customer belum tersedia';
  }, [validationAddressRef, customerLocation]);

  const currentAddressText = useMemo(
    () => (String(currentAddress || '').trim() || DEFAULT_CURRENT_ADDRESS),
    [currentAddress]
  );

  const distanceToCustomerKm = useMemo(() => {
    if (isFollowUp) return null;
    return resolveDistanceToCustomerKm(activeTask, currentLocation, validationAddressRef);
  }, [isFollowUp, activeTask, currentLocation, validationAddressRef]);

  const isInsideRadius = useMemo(() => {
    if (!Number.isFinite(distanceToCustomerKm)) return null;
    return distanceToCustomerKm <= DISTANCE_LIMIT_KM;
  }, [distanceToCustomerKm]);

  const distanceLabel = Number.isFinite(distanceToCustomerKm)
    ? distanceToCustomerKm.toFixed(2)
    : '0.00';

  const distanceContext = isInsideRadius === false
    ? `Di luar radius ${DISTANCE_LIMIT_KM} KM`
    : `Dalam radius ${DISTANCE_LIMIT_KM} KM`;

  const closeValidationPopup = useCallback((result) => {
    if (isMountedRef.current) {
      setValidationPopup((prev) => ({ ...prev, open: false }));
    }
    if (validationPopupResolverRef.current) {
      const pendingResolve = validationPopupResolverRef.current;
      validationPopupResolverRef.current = null;
      pendingResolve(Boolean(result));
    }
  }, []);

  const closeOutOfRangeDecision = useCallback((result) => {
    if (isMountedRef.current) {
      setOutOfRangeDecision((prev) => ({
        ...prev,
        open: false,
        loading: result === 'save' || result === 'without_save',
      }));
    }
    if (outOfRangeDecisionResolverRef.current) {
      const pendingResolve = outOfRangeDecisionResolverRef.current;
      outOfRangeDecisionResolverRef.current = null;
      pendingResolve(result);
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
      if (!isMountedRef.current) {
        return Promise.resolve(false);
      }

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
        if (!isMountedRef.current) {
          resolve(false);
          return;
        }
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

  const showOutOfRangeDecision = useCallback(({ distanceKm }) => {
    if (!isMountedRef.current) {
      return Promise.resolve('cancel');
    }

    if (outOfRangeDecisionResolverRef.current) {
      const pendingResolve = outOfRangeDecisionResolverRef.current;
      outOfRangeDecisionResolverRef.current = null;
      pendingResolve('cancel');
    }

    const normalizedDistance = Number.isFinite(distanceKm) ? Number(distanceKm) : null;

    setOutOfRangeDecision({
      open: true,
      distanceKm: normalizedDistance,
      loading: false,
    });

    return new Promise((resolve) => {
      if (!isMountedRef.current) {
        resolve('cancel');
        return;
      }
      outOfRangeDecisionResolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    setTaskMeta(taskData ?? null);
  }, [taskData, taskId]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (validationPopupResolverRef.current) {
        validationPopupResolverRef.current(false);
        validationPopupResolverRef.current = null;
      }
      if (outOfRangeDecisionResolverRef.current) {
        outOfRangeDecisionResolverRef.current('cancel');
        outOfRangeDecisionResolverRef.current = null;
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
    setCameraError('');
    setHasAutoOpenedCamera(false);
    setShowLocationInfo(true);
    setValidationAddressRef(null);
    setDoneSuccess(null);
    setOutOfRangeDecision({ open: false, distanceKm: null, loading: false });
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !isFollowUp || hasAutoOpenedCamera) return;
    setHasAutoOpenedCamera(true);
    setCameraActive(true);
  }, [taskId, isFollowUp, hasAutoOpenedCamera]);

  const handleBackToPlan = useCallback(() => {
    navigate('/plan', { replace: true });
  }, [navigate]);

  const handleOpenCamera = () => {
    setCameraError('');
    setCameraActive(true);
  };

  const handleCameraCapture = (imageData) => {
    setCapturedImage(imageData);
    setCameraError('');
    setCameraActive(false);
  };

  const handleCloseCamera = () => {
    setCameraError('');
    setCameraActive(false);
  };

  const handleGetCurrentLocation = async () => {
    if (!isMountedRef.current) return;

    try {
      setLocationLoading(true);
      const { getAccurateLocation } = await import('../../../utils/geocoding');
      const locationData = await getAccurateLocation({
        desiredAccuracy: 100,
        maxRetries: 2,
      });

      if (!isMountedRef.current) return;

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
      if (isMountedRef.current) {
        await showValidationAlert(`Error: ${err.message}`, {
          title: 'Gagal Mengambil Lokasi',
          type: 'error',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLocationLoading(false);
      }
    }
  };

  const handleMapLocationChange = (lat, lng) => {
    if (!isMountedRef.current) return;
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
    if (!taskId || !isMountedRef.current) return;
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      if (isMountedRef.current) {
        await showValidationAlert('Silakan ambil lokasi saat ini terlebih dahulu.', {
          title: 'Lokasi Belum Tersedia',
          type: 'warning',
        });
      }
      return;
    }

    try {
      if (!isMountedRef.current) return;
      let currentValidationAddressRef = validationAddressRef;
      let shouldSaveFixAddress = false;
      let hasAskedFixAddressChoice = false;

      if (!isFollowUp && !currentValidationAddressRef) {
        currentValidationAddressRef = await loadValidationAddressReference(activeTask);
        if (!isMountedRef.current) return;
        setValidationAddressRef(currentValidationAddressRef);
      }

      if (!isFollowUp) {
        const distanceToCustomerKm = resolveDistanceToCustomerKm(
          activeTask,
          currentLocation,
          currentValidationAddressRef
        );
        if (Number.isFinite(distanceToCustomerKm) && distanceToCustomerKm > DISTANCE_LIMIT_KM) {
          hasAskedFixAddressChoice = true;
          const outOfRangeChoice = await showOutOfRangeDecision({
            distanceKm: distanceToCustomerKm,
          });
          if (!isMountedRef.current) return;
          if (outOfRangeChoice === 'cancel') {
            return;
          }
          shouldSaveFixAddress = outOfRangeChoice === 'save';
        }
      }

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
      if (!isMountedRef.current) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        invalidateCache(dateToUse);
        await fetchPlansByDate(dateToUse, true);
        if (!isMountedRef.current) return;
        throw new Error(errorData.message || 'Failed to save result');
      }

      const donePayload = await response.json().catch(() => ({}));
      if (!isMountedRef.current) return;

      if (!isFollowUp) {
        const { needsFixAddressConfirmation, distanceKm } = resolveFixAddressConfirmation(
          donePayload,
          activeTask,
          currentLocation,
          currentValidationAddressRef
        );
        if (!shouldSaveFixAddress && needsFixAddressConfirmation && !hasAskedFixAddressChoice) {
          const outOfRangeChoice = await showOutOfRangeDecision({
            distanceKm: distanceKm ?? null,
          });
          if (!isMountedRef.current) return;
          if (outOfRangeChoice === 'cancel') {
            return;
          }
          shouldSaveFixAddress = outOfRangeChoice === 'save';
        }

        if (shouldSaveFixAddress) {
          const customerId = activeTask?.customer_id ?? activeTask?.customerId ?? null;

          if (!customerId) {
            if (isMountedRef.current) {
              await showValidationAlert(
                'Done berhasil disimpan, tetapi customer ID tidak ditemukan sehingga fix address tidak tersimpan.',
                {
                  title: 'Fix Address Tidak Tersimpan',
                  type: 'warning',
                }
              );
            }
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
            if (!isMountedRef.current) return;

            if (!fixAddressResponse.ok) {
              const fixAddressError = await fixAddressResponse.json().catch(() => ({}));
              if (isMountedRef.current) {
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
        }
      }

      if (!isMountedRef.current) return;
      invalidateCache(dateToUse);
      fetchPlansByDate(dateToUse, true).catch((err) => {
        console.error('Error refreshing after done:', err);
      });
      setDoneSuccess({
        customerName: taskName,
        address: customerAddress,
        completedAt:
          donePayload?.completed_at ??
          donePayload?.result_saved_at ??
          donePayload?.saved_at ??
          new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error saving result:', err);
      if (isMountedRef.current) {
        await showValidationAlert(`Error: ${err.message}`, {
          title: 'Gagal Menyimpan Done',
          type: 'error',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
        setOutOfRangeDecision((prev) => ({ ...prev, loading: false }));
      }
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

  if (doneSuccess) {
    return (
      <SucceedScreen
        customerName={doneSuccess.customerName}
        address={doneSuccess.address}
        completedAt={doneSuccess.completedAt}
        onViewHistory={handleBackToPlan}
      />
    );
  }

  if ((outOfRangeDecision.open || outOfRangeDecision.loading) && !isFollowUp) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          width: '100%',
          backgroundColor: '#f7f7f5',
        }}
      >
        <ValidateOutRange
          customerName={taskName}
          address={customerAddress}
          distanceKm={outOfRangeDecision.distanceKm}
          radiusLimitKm={DISTANCE_LIMIT_KM}
          loading={outOfRangeDecision.loading}
          onConfirmWithoutSave={() => closeOutOfRangeDecision('without_save')}
          onConfirmAndSave={() => closeOutOfRangeDecision('save')}
          onCancel={() => closeOutOfRangeDecision('cancel')}
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
        onBack={handleBackToPlan}
        taskName={taskName}
        planNo={planNo}
        tujuan={activeTask?.tujuan}
        onRefreshLocation={handleGetCurrentLocation}
        refreshLoading={locationLoading}
        refreshDisabled={locationLoading || saving}
      />

      {cameraActive ? (
        <CameraDone
          saving={saving}
          onCapture={handleCameraCapture}
          onCameraErrorChange={setCameraError}
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
          {!isFollowUp ? (
            <>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                }}
              >
                <MapsDone
                  currentLocation={currentLocation}
                  customerLocation={customerLocation}
                  customerAddress={customerAddress}
                  resultAddress={currentAddressText}
                  distanceKm={distanceToCustomerKm}
                  locationLoading={locationLoading}
                  saving={saving}
                  onGetCurrentLocation={handleGetCurrentLocation}
                  onMapLocationChange={handleMapLocationChange}
                />
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 540,
                    mx: 'auto',
                    px: { xs: 2, sm: 2.5 },
                    pt: 0,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      pointerEvents: 'auto',
                      borderRadius: '0 0 16px 16px',
                      border: '1px solid rgba(22, 58, 107, 0.13)',
                      borderTop: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 7px 16px rgba(10, 28, 53, 0.12)',
                      px: 1.3,
                      py: 0.95,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: '#1b3557', fontWeight: 700, lineHeight: 1.2 }}>
                          Informasi Lokasi
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#7a8ea7', fontWeight: 600 }}>
                          {showLocationInfo ? 'Tap untuk sembunyikan' : 'Tap untuk tampilkan'}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => setShowLocationInfo((prev) => !prev)}
                        size="small"
                        sx={{ color: '#1f4e8c', backgroundColor: 'rgba(31, 78, 140, 0.1)' }}
                        aria-label={showLocationInfo ? 'Sembunyikan informasi lokasi' : 'Tampilkan informasi lokasi'}
                      >
                        {showLocationInfo ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={showLocationInfo}>
                      <Box sx={{ pt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <PlaceOutlinedIcon sx={{ color: '#1f4e8c', mt: 0.2, fontSize: 18 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: '#1b3557', fontWeight: 700, mb: 0.25 }}
                            >
                              Lokasi Customer (Target)
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: '#647c94',
                                lineHeight: 1.42,
                                wordBreak: 'break-word',
                              }}
                              title={customerAddress}
                            >
                              {customerAddress}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            borderTop: '1px solid rgba(22, 58, 107, 0.09)',
                            my: 0.95,
                          }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <MyLocationOutlinedIcon sx={{ color: '#29924f', mt: 0.2, fontSize: 18 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: '#1b3557', fontWeight: 700, mb: 0.25 }}
                            >
                              Lokasi Anda Saat Ini
                            </Typography>
                            {addressLoading ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <CircularProgress size={14} sx={{ color: '#1f4e8c' }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#647c94',
                                    lineHeight: 1.42,
                                  }}
                                >
                                  Mengambil alamat...
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  color: '#647c94',
                                  lineHeight: 1.42,
                                  wordBreak: 'break-word',
                                }}
                                title={currentAddressText}
                              >
                                {currentAddressText}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1.1,
                            color: '#15355f',
                            fontWeight: 700,
                          }}
                        >
                          Jarak: {distanceLabel} KM ({distanceContext})
                        </Typography>
                      </Box>
                    </Collapse>
                  </Paper>

                  <Box
                    sx={{
                      mt: 0.75,
                      mb: 0.85,
                      borderRadius: 2,
                      px: 1.15,
                      py: 0.85,
                      border: isInsideRadius === null
                        ? '1px solid rgba(22, 58, 107, 0.2)'
                        : isInsideRadius
                        ? '1px solid rgba(36, 130, 74, 0.32)'
                        : '1px solid rgba(211, 47, 47, 0.3)',
                      backgroundColor: isInsideRadius === null
                        ? 'rgba(255, 255, 255, 0.9)'
                        : isInsideRadius
                        ? 'rgba(234, 250, 240, 0.92)'
                        : 'rgba(252, 235, 235, 0.92)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 700,
                        color: isInsideRadius === null ? '#1b3557' : isInsideRadius ? '#1f7a3d' : '#b3261e',
                      }}
                    >
                      {isInsideRadius === null
                        ? 'Lokasi Anda belum tersedia untuk validasi radius'
                        : isInsideRadius
                        ? 'Anda berada dalam radius customer'
                        : 'Anda berada di luar radius (maks. 2 KM)'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          ) : (
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
          )}
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
            <>
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
            </>
          ) : null}

          {!currentLocation ? (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#b3261e',
                fontWeight: 600,
                mb: 1.15,
              }}
            >
              Lokasi belum tersedia. Gunakan tombol refresh di header
              {!isFollowUp ? ' atau Ambil Lokasi Saat Ini pada area map.' : '.'}
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
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Done'}
          </Button>
        </Paper>
      </Box>

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
