import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddLocationAltRoundedIcon from '@mui/icons-material/AddLocationAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FmdGoodRoundedIcon from '@mui/icons-material/FmdGoodRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

import { AddressMap } from '../maps';
import { getCoordinatesFromAddressEnhanced } from '../../../utils/geocoding';
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
} from './AddCustomerAddress';

const MASTER_ADDRESS_ID = 'master';
const DEFAULT_COORDINATES = {
  LAT: -6.14524734321372,
  LNG: 106.67938722917663,
};

const formatAddressPreview = (value) => {
  const normalizedValue = (value || '').replace(/\s+/g, ' ').trim();

  if (!normalizedValue) {
    return 'Alamat belum tersedia.';
  }

  if (normalizedValue.length <= 90) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 90)}...`;
};

function AddressCard({
  address,
  title,
  selected,
  onClick,
  icon,
  action,
}) {
  return (
    <Paper
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        p: 1.5,
        borderRadius: '16px',
        border: selected ? '1px solid #1f4e8c' : '1px solid rgba(15, 23, 42, 0.1)',
        backgroundColor: selected ? '#e9f1fb' : '#fff',
        boxShadow: selected
          ? '0 10px 22px rgba(31, 78, 140, 0.16)'
          : '0 8px 18px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          border: '1px solid rgba(31, 78, 140, 0.35)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          backgroundColor: selected ? '#cfe1f8' : 'rgba(15, 23, 42, 0.06)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: selected ? 'var(--theme-blue-primary)' : '#334155',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            mb: 0.35,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: '#475569',
            lineHeight: 1.45,
            display: 'block',
            wordBreak: 'break-word',
          }}
        >
          {formatAddressPreview(address)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
        {action || null}
        <Box sx={{ pt: 0.15, color: selected ? 'var(--theme-blue-primary)' : 'rgba(15, 23, 42, 0.36)' }}>
          {selected ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
        </Box>
      </Box>
    </Paper>
  );
}

export default function AddAddress({
  open,
  onClose,
  onBackToAddPlan,
  onApplyAddress,
  customerId = '',
  initialAddressId = MASTER_ADDRESS_ID,
  initialAddress = '',
  initialOriginalAddress = '',
  initialLatitude = null,
  initialLongitude = null,
}) {
  const [primaryAddress, setPrimaryAddress] = useState({
    id: MASTER_ADDRESS_ID,
    title: 'Alamat Utama',
    address: '',
    latitude: null,
    longitude: null,
  });
  const [additionalAddresses, setAdditionalAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(MASTER_ADDRESS_ID);
  const [latitude, setLatitude] = useState(DEFAULT_COORDINATES.LAT);
  const [longitude, setLongitude] = useState(DEFAULT_COORDINATES.LNG);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [openAddSheet, setOpenAddSheet] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const hasCoordinates = useMemo(() => {
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  }, [latitude, longitude]);

  const allAddresses = useMemo(() => {
    return [primaryAddress, ...additionalAddresses];
  }, [primaryAddress, additionalAddresses]);

  const selectedAddress = useMemo(() => {
    return allAddresses.find((item) => item.id === selectedAddressId) || primaryAddress;
  }, [allAddresses, selectedAddressId, primaryAddress]);

  const updateAddressCoordinates = useCallback((addressId, lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (addressId === MASTER_ADDRESS_ID) {
      setPrimaryAddress((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      return;
    }

    setAdditionalAddresses((prev) => prev.map((item) => (
      item.id === addressId
        ? {
            ...item,
            latitude: lat,
            longitude: lng,
          }
        : item
    )));
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const hasInitialCoordinates = Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude);

    const applyFallbackData = () => {
      const normalizedOriginalAddress = (initialOriginalAddress || initialAddress || '').trim();
      const normalizedInitialAddress = (initialAddress || '').trim();
      const isUsingPrimaryAddress =
        !normalizedInitialAddress || normalizedInitialAddress === normalizedOriginalAddress;

      const nextPrimaryAddress = {
        id: MASTER_ADDRESS_ID,
        title: 'Alamat Utama',
        address: normalizedOriginalAddress,
        latitude: isUsingPrimaryAddress && hasInitialCoordinates ? initialLatitude : null,
        longitude: isUsingPrimaryAddress && hasInitialCoordinates ? initialLongitude : null,
      };

      const nextAdditionalAddresses = [];
      let nextSelectedAddressId = MASTER_ADDRESS_ID;

      if (normalizedInitialAddress && !isUsingPrimaryAddress) {
        const initialAdditionalId = `additional-${Date.now()}`;
        nextAdditionalAddresses.push({
          id: initialAdditionalId,
          title: 'Alamat Tambahan',
          address: normalizedInitialAddress,
          latitude: hasInitialCoordinates ? initialLatitude : null,
          longitude: hasInitialCoordinates ? initialLongitude : null,
        });
        nextSelectedAddressId = initialAdditionalId;
      }

      setPrimaryAddress(nextPrimaryAddress);
      setAdditionalAddresses(nextAdditionalAddresses);
      setSelectedAddressId(nextSelectedAddressId);

      if (hasInitialCoordinates) {
        setLatitude(initialLatitude);
        setLongitude(initialLongitude);
      } else {
        setLatitude(DEFAULT_COORDINATES.LAT);
        setLongitude(DEFAULT_COORDINATES.LNG);
      }
    };

    const initializeFromApi = async () => {
      if (!customerId) {
        applyFallbackData();
        return;
      }

      setLoadingAddresses(true);
      try {
        const addresses = await getCustomerAddresses(customerId);
        if (cancelled) return;

        const masterAddress = addresses.find((item) => item.id === MASTER_ADDRESS_ID || item.isDefault || item.source === 'master');
        const nextPrimaryAddress = {
          id: MASTER_ADDRESS_ID,
          title: 'Alamat Utama',
          address: masterAddress?.address || (initialOriginalAddress || initialAddress || '').trim(),
          latitude: masterAddress?.latitude ?? null,
          longitude: masterAddress?.longitude ?? null,
        };

        const nextAdditionalAddresses = addresses
          .filter((item) => item.id !== MASTER_ADDRESS_ID && !item.isDefault)
          .map((item) => ({
            id: item.id,
            title: 'Alamat Tambahan',
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
          }));

        const addressMap = new Map([
          [nextPrimaryAddress.id, nextPrimaryAddress],
          ...nextAdditionalAddresses.map((item) => [item.id, item]),
        ]);

        let nextSelectedAddressId = MASTER_ADDRESS_ID;
        if (initialAddressId && addressMap.has(initialAddressId)) {
          nextSelectedAddressId = initialAddressId;
        } else if ((initialAddress || '').trim()) {
          const initialAddressLower = initialAddress.trim().toLowerCase();
          const matchedAddress = nextAdditionalAddresses.find(
            (item) => item.address?.trim().toLowerCase() === initialAddressLower,
          );
          if (matchedAddress) {
            nextSelectedAddressId = matchedAddress.id;
          }
        }

        setPrimaryAddress(nextPrimaryAddress);
        setAdditionalAddresses(nextAdditionalAddresses);
        setSelectedAddressId(nextSelectedAddressId);

        const selectedItem = addressMap.get(nextSelectedAddressId);
        if (hasInitialCoordinates) {
          setLatitude(initialLatitude);
          setLongitude(initialLongitude);
        } else if (Number.isFinite(selectedItem?.latitude) && Number.isFinite(selectedItem?.longitude)) {
          setLatitude(selectedItem.latitude);
          setLongitude(selectedItem.longitude);
        } else {
          setLatitude(DEFAULT_COORDINATES.LAT);
          setLongitude(DEFAULT_COORDINATES.LNG);
        }

        setError('');
      } catch (apiError) {
        if (cancelled) return;
        setError(apiError?.message || 'Gagal mengambil alamat customer.');
        applyFallbackData();
      } finally {
        if (!cancelled) {
          setLoadingAddresses(false);
        }
      }
    };

    setOpenAddSheet(false);
    setNewAddressText('');
    setEditingAddressId(null);
    setSubmitting(false);
    setError('');

    initializeFromApi();

    return () => {
      cancelled = true;
    };
  }, [open, customerId, initialAddressId, initialAddress, initialOriginalAddress, initialLatitude, initialLongitude]);

  useEffect(() => {
    if (!open || !selectedAddress) return;

    const hasSelectedCoordinates =
      Number.isFinite(selectedAddress.latitude) && Number.isFinite(selectedAddress.longitude);

    if (hasSelectedCoordinates) {
      setLatitude(selectedAddress.latitude);
      setLongitude(selectedAddress.longitude);
      return;
    }

    const addressToGeocode = selectedAddress.address?.trim() || '';
    if (addressToGeocode.length < 5) return;

    let cancelled = false;

    const fetchCoordinates = async () => {
      setGeocodingLoading(true);
      try {
        const geocodingResult = await getCoordinatesFromAddressEnhanced(addressToGeocode);
        if (cancelled) return;

        if (Number.isFinite(geocodingResult?.lat) && Number.isFinite(geocodingResult?.lng)) {
          setLatitude(geocodingResult.lat);
          setLongitude(geocodingResult.lng);
          updateAddressCoordinates(selectedAddress.id, geocodingResult.lat, geocodingResult.lng);
        }
      } catch (geocodingError) {
        if (!cancelled) {
          console.warn('Failed to geocode selected address:', geocodingError?.message);
        }
      } finally {
        if (!cancelled) {
          setGeocodingLoading(false);
        }
      }
    };

    fetchCoordinates();

    return () => {
      cancelled = true;
    };
  }, [open, selectedAddress, updateAddressCoordinates]);

  const handleBack = useCallback(() => {
    if (onBackToAddPlan) {
      onBackToAddPlan();
      return;
    }

    if (onClose) {
      onClose();
    }
  }, [onBackToAddPlan, onClose]);

  const handleMapLocationChange = useCallback((lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setLatitude(lat);
    setLongitude(lng);
    updateAddressCoordinates(selectedAddressId, lat, lng);
    setError('');
  }, [selectedAddressId, updateAddressCoordinates]);

  const handleSelectAddress = useCallback((item) => {
    if (!item) return;

    setSelectedAddressId(item.id);
    setError('');

    if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
      setLatitude(item.latitude);
      setLongitude(item.longitude);
    }
  }, []);

  const handleOpenAddSheet = useCallback(() => {
    if (!customerId) {
      setError('Pilih customer di halaman Add Plan terlebih dahulu.');
      return;
    }

    setOpenAddSheet(true);
    setNewAddressText('');
    setEditingAddressId(null);
    setError('');
  }, [customerId]);

  const handleCloseAddSheet = useCallback(() => {
    if (addingAddress) return;

    setOpenAddSheet(false);
    setNewAddressText('');
    setEditingAddressId(null);
  }, [addingAddress]);

  const handleEditAdditionalAddress = useCallback((item) => {
    if (!item) return;

    setEditingAddressId(item.id);
    setNewAddressText(item.address || '');
    setOpenAddSheet(true);
    setError('');
  }, []);

  const handleSaveAdditionalAddress = useCallback(async () => {
    const normalizedAddress = newAddressText.trim();

    if (normalizedAddress.length < 5) {
      setError('Alamat tambahan minimal 5 karakter.');
      return;
    }

    if (!customerId) {
      setError('Customer belum dipilih. Kembali ke Add Plan dan pilih customer terlebih dahulu.');
      return;
    }

    setAddingAddress(true);
    const editingItem = additionalAddresses.find((item) => item.id === editingAddressId);

    let nextLatitude = Number.isFinite(editingItem?.latitude)
      ? editingItem.latitude
      : Number.isFinite(latitude)
        ? latitude
        : DEFAULT_COORDINATES.LAT;
    let nextLongitude = Number.isFinite(editingItem?.longitude)
      ? editingItem.longitude
      : Number.isFinite(longitude)
        ? longitude
        : DEFAULT_COORDINATES.LNG;

    try {
      const geocodingResult = await getCoordinatesFromAddressEnhanced(normalizedAddress);
      if (Number.isFinite(geocodingResult?.lat) && Number.isFinite(geocodingResult?.lng)) {
        nextLatitude = geocodingResult.lat;
        nextLongitude = geocodingResult.lng;
      }
    } catch (geocodingError) {
      console.warn('Failed to geocode additional address:', geocodingError?.message);
    }

    try {
      if (editingAddressId) {
        const updatedAddress = await updateCustomerAddress(customerId, editingAddressId, {
          address: normalizedAddress,
          latitude: nextLatitude,
          longitude: nextLongitude,
        });

        setAdditionalAddresses((prev) => prev.map((item) => (
          item.id === editingAddressId
            ? {
                ...item,
                address: updatedAddress?.address || normalizedAddress,
                latitude: updatedAddress?.latitude ?? nextLatitude,
                longitude: updatedAddress?.longitude ?? nextLongitude,
              }
            : item
        )));

        setSelectedAddressId(editingAddressId);
        setLatitude(updatedAddress?.latitude ?? nextLatitude);
        setLongitude(updatedAddress?.longitude ?? nextLongitude);
      } else {
        const createdAddress = await createCustomerAddress(customerId, {
          address: normalizedAddress,
          latitude: nextLatitude,
          longitude: nextLongitude,
        });

        if (!createdAddress?.id) {
          throw new Error('Gagal menyimpan alamat tambahan.');
        }

        setAdditionalAddresses((prev) => [
          ...prev,
          {
            id: createdAddress.id,
            title: 'Alamat Tambahan',
            address: createdAddress.address || normalizedAddress,
            latitude: createdAddress.latitude ?? nextLatitude,
            longitude: createdAddress.longitude ?? nextLongitude,
          },
        ]);
        setSelectedAddressId(createdAddress.id);
        setLatitude(createdAddress.latitude ?? nextLatitude);
        setLongitude(createdAddress.longitude ?? nextLongitude);
      }

      setOpenAddSheet(false);
      setNewAddressText('');
      setEditingAddressId(null);
      setError('');
    } catch (apiError) {
      setError(apiError?.message || 'Gagal menyimpan alamat tambahan.');
    } finally {
      setAddingAddress(false);
    }
  }, [newAddressText, latitude, longitude, editingAddressId, additionalAddresses, customerId]);

  const handleDeleteAdditionalAddress = useCallback(async (item) => {
    if (!item?.id) return;
    if (!customerId) {
      setError('Customer belum dipilih. Kembali ke Add Plan dan pilih customer terlebih dahulu.');
      return;
    }

    setAddingAddress(true);
    try {
      await deleteCustomerAddress(customerId, item.id);
      setAdditionalAddresses((prev) => prev.filter((addressItem) => addressItem.id !== item.id));

      if (selectedAddressId === item.id) {
        setSelectedAddressId(MASTER_ADDRESS_ID);
      }

      setError('');
    } catch (apiError) {
      setError(apiError?.message || 'Gagal menghapus alamat tambahan.');
    } finally {
      setAddingAddress(false);
    }
  }, [customerId, selectedAddressId]);

  const handleApply = useCallback(async () => {
    if (!hasCoordinates) {
      setError('Koordinat belum tersedia. Silakan atur marker pada peta.');
      return;
    }

    if (!selectedAddress) {
      setError('Silakan pilih alamat terlebih dahulu.');
      return;
    }

    setSubmitting(true);

    try {
      if (customerId && selectedAddress.id !== MASTER_ADDRESS_ID && selectedAddress.address?.trim()) {
        const updatedAddress = await updateCustomerAddress(customerId, selectedAddress.id, {
          address: selectedAddress.address?.trim() || '',
          latitude,
          longitude,
        });

        setAdditionalAddresses((prev) => prev.map((item) => (
          item.id === selectedAddress.id
            ? {
                ...item,
                address: updatedAddress?.address || item.address,
                latitude: updatedAddress?.latitude ?? latitude,
                longitude: updatedAddress?.longitude ?? longitude,
              }
            : item
        )));
      }

      if (onApplyAddress) {
        const selectedAddressText = selectedAddress.address?.trim() || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        onApplyAddress({
          customerId: customerId || '',
          addressId: selectedAddress.id || MASTER_ADDRESS_ID,
          address: selectedAddressText,
          originalAddress: primaryAddress.address?.trim() || '',
          latitude,
          longitude,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [hasCoordinates, selectedAddress, onApplyAddress, customerId, latitude, longitude, primaryAddress.address]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleBack}
        fullScreen
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 0,
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{
              width: '100%',
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderBottom: '1px solid rgba(255, 255, 255, 0.24)',
                background: 'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handleBack}
                  sx={{
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    },
                  }}
                  aria-label="Kembali"
                >
                  <ArrowBackIcon />
                </IconButton>

                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                  Alamat dan Maps
                </Typography>
              </Box>
            </Box>

            <Box sx={{ px: 2, pt: 1.5, position: 'relative', zIndex: 1 }}>
              <Paper
                sx={{
                  position: 'relative',
                  height: { xs: 250, sm: 320 },
                  borderRadius: '20px',
                  overflow: 'hidden',
                  backgroundColor: '#e2e8f0',
                  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.16)',
                }}
              >
                <AddressMap
                  address={selectedAddress?.address || ''}
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={handleMapLocationChange}
                  mapTypeControl
                  fullscreenControl={false}
                />

                {geocodingLoading ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      px: 1.4,
                      py: 0.7,
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.9,
                      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.16)',
                    }}
                  >
                    <CircularProgress size={14} sx={{ color: 'var(--theme-blue-primary)' }} />
                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                      Menentukan titik alamat...
                    </Typography>
                  </Box>
                ) : null}

                {hasCoordinates ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 10,
                      bottom: 10,
                      px: 1,
                      py: 0.6,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Typography>
                  </Box>
                ) : null}
              </Paper>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 2,
                pt: 2,
                pb: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 700, mb: 1.1 }}>
                Pilih Alamat
              </Typography>

              <AddressCard
                title="Alamat Utama"
                address={primaryAddress.address}
                selected={selectedAddressId === MASTER_ADDRESS_ID}
                onClick={() => handleSelectAddress(primaryAddress)}
                icon={<FmdGoodRoundedIcon fontSize="small" />}
              />

              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#0f172a', fontWeight: 700 }}>
                  Alamat Tambahan
                </Typography>

                <Button
                  onClick={handleOpenAddSheet}
                  startIcon={<AddLocationAltRoundedIcon sx={{ fontSize: '1rem !important' }} />}
                  variant="contained"
                  disabled={loadingAddresses || addingAddress || !customerId}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: 'var(--theme-blue-primary)',
                    borderRadius: '10px',
                    px: 1.2,
                    py: 0.6,
                    minWidth: 'fit-content',
                    boxShadow: '0 8px 20px rgba(31, 78, 140, 0.26)',
                    '&:hover': {
                      backgroundColor: 'var(--theme-blue-overlay)',
                    },
                  }}
                >
                  Tambah Alamat
                </Button>
              </Box>

              {loadingAddresses ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Memuat daftar alamat...
                  </Typography>
                </Box>
              ) : null}

              {additionalAddresses.length === 0 ? (
                <Box
                  sx={{
                    border: '1px dashed rgba(15, 23, 42, 0.2)',
                    borderRadius: '14px',
                    p: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Belum ada alamat tambahan
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {additionalAddresses.map((item, index) => (
                    <AddressCard
                      key={item.id}
                      title={`Alamat Tambahan ${index + 1}`}
                      address={item.address}
                      selected={selectedAddressId === item.id}
                      onClick={() => handleSelectAddress(item)}
                      icon={<LocationOnOutlinedIcon fontSize="small" />}
                      action={(
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.7,
                            py: 0.35,
                            borderRadius: '999px',
                            border: '1px solid rgba(15, 23, 42, 0.12)',
                            backgroundColor: 'rgba(255, 255, 255, 0.82)',
                          }}
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditAdditionalAddress(item);
                            }}
                            startIcon={<EditRoundedIcon sx={{ fontSize: '0.86rem !important' }} />}
                            sx={{
                              minWidth: 0,
                              px: 0.25,
                              py: 0.1,
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              lineHeight: 1.2,
                              fontWeight: 600,
                              color: 'var(--theme-blue-primary)',
                              '& .MuiButton-startIcon': {
                                mr: 0.3,
                                ml: 0,
                              },
                              '&:hover': {
                                backgroundColor: 'transparent',
                                color: 'var(--theme-blue-overlay)',
                              },
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteAdditionalAddress(item);
                            }}
                            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                            disabled={addingAddress}
                            sx={{
                              minWidth: 0,
                              px: 0.25,
                              py: 0.1,
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              lineHeight: 1.2,
                              fontWeight: 600,
                              color: '#c62828',
                              '& .MuiButton-startIcon': {
                                mr: 0.3,
                                ml: 0,
                              },
                              '&:hover': {
                                backgroundColor: 'transparent',
                                color: '#b71c1c',
                              },
                            }}
                          >
                            Hapus
                          </Button>
                        </Box>
                      )}
                    />
                  ))}
                </Box>
              )}

              {error ? (
                <Alert severity="error" sx={{ mt: 1.4 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              ) : null}
            </Box>

            <Box
              sx={{
                px: 2,
                pt: 1.4,
                pb: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
                borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                gap: 1.2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                onClick={handleBack}
                disabled={submitting || loadingAddresses || addingAddress}
                sx={{
                  minHeight: 46,
                  textTransform: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  borderColor: 'rgba(15, 23, 42, 0.22)',
                  color: '#0f172a',
                }}
              >
                Kembali
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={handleApply}
                disabled={submitting || loadingAddresses || addingAddress || geocodingLoading || !hasCoordinates}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon />}
                sx={{
                  minHeight: 46,
                  textTransform: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  color: '#fff',
                  backgroundColor: 'var(--theme-blue-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--theme-blue-overlay)',
                  },
                }}
              >
                Gunakan Alamat
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openAddSheet}
        onClose={handleCloseAddSheet}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-end',
          },
        }}
        PaperProps={{
          sx: {
            width: '100%',
            m: 0,
            borderRadius: '18px 18px 0 0',
          },
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {editingAddressId ? 'Edit Alamat Tambahan' : 'Tambah Alamat'}
            </Typography>
            <IconButton size="small" onClick={handleCloseAddSheet} disabled={addingAddress}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b', mb: 1.2 }}>
            {editingAddressId
              ? 'Perbarui alamat tambahan. Lokasi pada map akan ikut diperbarui.'
              : 'Tambahkan alamat customer tambahan. Lokasi di map akan menyesuaikan otomatis.'}
          </Typography>

          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="Masukkan alamat tambahan..."
            value={newAddressText}
            onChange={(event) => setNewAddressText(event.target.value)}
            disabled={addingAddress}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCloseAddSheet}
              disabled={addingAddress}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSaveAdditionalAddress}
              disabled={addingAddress}
              startIcon={addingAddress ? <CircularProgress size={16} color="inherit" /> : <AddLocationAltRoundedIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: 'var(--theme-blue-primary)',
                '&:hover': {
                  backgroundColor: 'var(--theme-blue-overlay)',
                },
              }}
            >
              {editingAddressId ? 'Simpan Perubahan' : 'Simpan Alamat'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
