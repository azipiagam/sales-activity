// React
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';

// Material-UI Components
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Custom imports
import { apiRequest } from '../config/api';
import AddressMap from './AddressMap';
import AlertDialog from './AlertDialog';
import LoadingPlan from './loading/LoadingPlan';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

// Utilities
import { parse } from 'date-fns';
import { getCoordinatesFromAddressEnhanced } from '../utils/geocoding';

// Constants
const ACTIVITY_TYPES = {
  VISIT: 'Visit',
  FOLLOW_UP: 'Follow Up',
};     

const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 2;      
const DEFAULT_COORDINATES = {
  LAT: -6.14524734321372,
  LNG: 106.67938722917663,
  TOLERANCE: 0.0001,
};

// Helper Components
const ActivityTypeButton = ({ type, label, selected, onClick }) => (
  <Button
    variant={selected ? 'contained' : 'outlined'}
    onClick={() => onClick(type)}
    fullWidth
    sx={{
      py: { xs: 1.25, sm: 1.5 },
      fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
      fontWeight: 600,
      backgroundColor: selected ? '#6BA3D0' : 'transparent',
      color: selected ? 'white' : '#6BA3D0',
      borderColor: '#6BA3D0',
      borderRadius: { xs: '8px', sm: '10px' },
      textTransform: 'none',
      '&:hover': {
        backgroundColor: selected ? '#5a8fb8' : 'rgba(107, 163, 208, 0.08)',
        borderColor: '#6BA3D0',
        color: selected ? 'white' : '#6BA3D0',
      },
    }}
  >
    {label}
  </Button>
);

// Custom Hooks
const useFormState = () => {
  const [formData, setFormData] = useState({
    date: '',
    customerId: '',
    customer: null,
    tujuan: '',
    keterangan: '',
  });

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      date: '',
      customerId: '',
      customer: null,
      tujuan: '',
      keterangan: '',
    });
  }, []);

  return { formData, updateField, resetForm };
};

const useCustomerSearch = () => {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const buildFullAddress = useCallback((customer) => {
    try {
      if (!customer || typeof customer !== 'object') return '';

      if (customer.originalAddress && customer.originalAddress.trim()) {
        return customer.originalAddress.trim();
      }

      const parts = [
        customer.address1,
        customer.city,
        customer.province
      ].filter(Boolean).map(part => part ? String(part).trim() : '').filter(Boolean);

      return parts.length > 0 ? parts.join(', ') : '';
    } catch (error) {
      console.error('Error building full address:', error);
      return '';
    }
  }, []);

  const searchCustomers = useCallback(async (keyword) => {
    if (!keyword || keyword.trim().length < MIN_SEARCH_LENGTH) {
      setCustomerOptions([]);
      return;
    }

    try {
      setSearchingCustomers(true);
      const response = await apiRequest(`customers/search?q=${encodeURIComponent(keyword)}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to search customers: ${response.status}`);
      }

      const data = await response.json();
      const mappedCustomers = (data || [])
        .map(customer => customer ? {
          customer_id: customer.id || customer.customer_id || '',
          nama: customer.customer_name || '',
          address1: customer.address || '',
          city: customer.city || '',
          province: customer.state || customer.province || '',
          company_name: customer.company_name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          originalAddress: customer.address || '',
        } : null)
        .filter(Boolean);

      setCustomerOptions(mappedCustomers);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerOptions([]);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput && searchInput.trim().length >= MIN_SEARCH_LENGTH) {
        searchCustomers(searchInput);
      } else {
        setCustomerOptions([]);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchCustomers]);

  return {
    customerOptions,
    searchingCustomers,
    searchInput,
    setSearchInput,
    inputValue,
    setInputValue,
    customerAddress,
    setCustomerAddress,
    buildFullAddress,
  };
};

const useLocationHandler = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const handleLocationChange = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const resetLocation = useCallback(() => {
    setLatitude(null);
    setLongitude(null);
  }, []);

  const isDefaultLocation = useCallback((lat, lng) => {
    return Math.abs(lat - DEFAULT_COORDINATES.LAT) < DEFAULT_COORDINATES.TOLERANCE &&
           Math.abs(lng - DEFAULT_COORDINATES.LNG) < DEFAULT_COORDINATES.TOLERANCE;
  }, []);

  return {
    latitude,
    longitude,
    handleLocationChange,
    resetLocation,
    isDefaultLocation,
  };
};

export default function AddPlan({ open, onClose, onOpenCheckIn }) {
  // UI State
  const [loading, setLoading] = useState(false);
  const [showLoadingPlan, setShowLoadingPlan] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingConfidence, setGeocodingConfidence] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '', fieldType: '' });
  const [successDialog, setSuccessDialog] = useState({ open: false, message: '' });

  // Refs
  const geocodingTimeoutRef = useRef(null);

  // Custom Hooks
  const { formData, updateField, resetForm } = useFormState();
  const {
    customerOptions,
    searchingCustomers,
    searchInput,
    setSearchInput,
    inputValue,
    setInputValue,
    customerAddress,
    setCustomerAddress,
    buildFullAddress,
  } = useCustomerSearch();
  const {
    latitude,
    longitude,
    handleLocationChange,
    resetLocation,
    isDefaultLocation,
  } = useLocationHandler();

  const { invalidateCache, fetchPlansByDate } = useActivityPlans();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleInputChange = useCallback((field) => (event) => {
    updateField(field, event.target.value);
  }, [updateField]);

  const handleCustomerChange = useCallback(async (event, newValue) => {
    try {
      if (!newValue) {
        updateField('customer', null);
        updateField('customerId', '');
        setCustomerAddress('');
        setInputValue('');
        setSearchInput('');
        setGeocodingConfidence(null);
        // Reset location when customer is cleared
        resetLocation();
        return;
      }

      const fullAddress = buildFullAddress(newValue);
      const customerId = newValue.customer_id || newValue.nama || '';
      const customerName = newValue.nama || '';

      updateField('customer', newValue);
      updateField('customerId', customerId);
      setCustomerAddress(fullAddress);
      setInputValue(customerName);
      setSearchInput('');

      // Geocode the customer address if it exists
      if (fullAddress && fullAddress.trim()) {
        setGeocodingLoading(true);
        try {
          const geocodingResult = await getCoordinatesFromAddressEnhanced(fullAddress);
          const { lat, lng, confidence } = geocodingResult;

          // Update location coordinates
          handleLocationChange(lat, lng);

          // Store confidence level
          setGeocodingConfidence(confidence);

          console.log(`Customer location found: ${lat}, ${lng} for address: "${fullAddress}" (confidence: ${confidence})`);
        } catch (geocodingError) {
          console.warn('Failed to geocode customer address:', geocodingError.message);
          // Keep default location, don't show error to user as it's not critical
        } finally {
          setGeocodingLoading(false);
        }
      }
    } catch (error) {
      console.error('Error handling customer change:', error);
      setErrorDialog({ open: true, message: 'Terjadi kesalahan saat memilih customer. Silakan coba lagi.', fieldType: 'customer' });
      updateField('customer', null);
      updateField('customerId', '');
      setCustomerAddress('');
      setInputValue('');
      setSearchInput('');
      setGeocodingLoading(false);
    }
  }, [updateField, buildFullAddress, handleLocationChange, resetLocation]);

  const handleCustomerInputChange = useCallback((event, newInputValue, reason) => {
    setInputValue(newInputValue);

    if (reason === 'input') {
      setSearchInput(newInputValue);
    } else if (reason === 'clear') {
      setSearchInput('');
      updateField('customer', null);
      updateField('customerId', '');
      setCustomerAddress('');
    }
  }, [updateField]);


  const handleTujuanClick = useCallback((tujuan) => {
    updateField('tujuan', tujuan);
  }, [updateField]);


  const handleCreatePlan = async () => {
    // Validasi form
    if (!formData.date) {
      setErrorDialog({ open: true, message: 'Tanggal harus diisi', fieldType: 'date' });
      return;
    }
    if (!formData.customerId || !formData.customer) {
      setErrorDialog({ open: true, message: 'Customer harus dipilih', fieldType: 'customer' });
      return;
    }
    if (!formData.tujuan) {
      setErrorDialog({ open: true, message: 'Tujuan harus dipilih', fieldType: 'tujuan' });
      return;
    }

    // Validasi tanggal harus >= hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planDate = new Date(formData.date);
    planDate.setHours(0, 0, 0, 0);

    if (planDate < today) {
      setErrorDialog({ open: true, message: 'Tanggal harus sama dengan atau setelah hari ini', fieldType: 'date' });
      return;
    }

    // Validasi koordinat
    if (!latitude || !longitude) {
      setErrorDialog({ open: true, message: 'Lokasi belum ditentukan. Geser marker pada peta untuk menentukan lokasi.', fieldType: 'location' });
      return;
    }

    if (isDefaultLocation(latitude, longitude)) {
      setErrorDialog({ open: true, message: 'Lokasi masih default. Geser marker ke lokasi yang sesuai.', fieldType: 'location' });
      return;
    }
    setLoading(true);
    setShowLoadingPlan(true);

    try {
      // Map tujuan ke format yang benar
      const tujuanFormatted = formData.tujuan === 'visit' ? ACTIVITY_TYPES.VISIT :
                             formData.tujuan === 'follow up' ? ACTIVITY_TYPES.FOLLOW_UP :
                             formData.tujuan;

      // Prepare request body
      const requestBody = {
        customer_id: formData.customerId,
        customer_name: formData.customer.nama || '',
        plan_date: formData.date,
        tujuan: tujuanFormatted,
        keterangan_tambahan: formData.keterangan || '',
        customer_location_lat: latitude || null,
        customer_location_lng: longitude || null,
      };

      // Call API endpoint
      const response = await apiRequest('activity-plans', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        
        // Extract error message
        let errorMessage = 'Gagal membuat activity plan';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // Handle validation errors
          const errorFields = Object.keys(errorData.errors);
          if (errorFields.length > 0) {
            errorMessage = errorData.errors[errorFields[0]][0] || errorMessage;
          }
        }
        
        setErrorDialog({ open: true, message: errorMessage, fieldType: 'general' });
        setLoading(false);
        return;
      }

      // Success response
      const result = await response.json();
      
      // Reset form
      resetForm();
      setCustomerAddress('');
      resetLocation();
      setSearchInput('');
      setInputValue('');
      setSuccessDialog({ open: true, message: 'Activity plan berhasil dibuat!' });

      // Close drawer immediately
      onClose();

      // Invalidate cache and refresh data for the plan date
      if (formData.date) {
        try {
          const planDate = parse(formData.date, 'yyyy-MM-dd', new Date());
          invalidateCache(planDate);
          await fetchPlansByDate(planDate, true);
        } catch (err) {
          console.error('Error refreshing cache:', err);
        }
      }

      // Dispatch custom event to trigger refresh in other components (for backward compatibility)
      window.dispatchEvent(new CustomEvent('activityPlanCreated', {
        detail: { planData: result.data }
      }));
    } catch (error) {
      console.error('Error creating plan:', error);
      setErrorDialog({ open: true, message: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.', fieldType: 'general' });
    } finally {
      setLoading(false);
      setShowLoadingPlan(false);
    }
  };

  const handleClose = useCallback(() => {
    // Clear any pending geocoding timeout
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
      geocodingTimeoutRef.current = null;
    }

    resetForm();
    setCustomerAddress('');
    resetLocation();
    setErrorDialog({ open: false, message: '', fieldType: '' });
    setSuccessDialog({ open: false, message: '' });
    setLoading(false);
    setShowLoadingPlan(false);
    setGeocodingLoading(false);
    setGeocodingConfidence(null);
    setSearchInput('');
    setInputValue('');
    onClose();
  }, [resetForm, resetLocation, onClose]);

  const handleAddressChange = useCallback(async (newAddress) => {
    setCustomerAddress(newAddress);

    // Geocode immediately if address is valid
    if (newAddress && newAddress.trim().length >= 5) {
      setGeocodingLoading(true);
      try {
        const geocodingResult = await getCoordinatesFromAddressEnhanced(newAddress.trim());
        const { lat, lng, confidence } = geocodingResult;

        handleLocationChange(lat, lng);
        setGeocodingConfidence(confidence);
        console.log(`Address geocoded: ${lat}, ${lng} for "${newAddress}" (confidence: ${confidence})`);
      } catch (geocodingError) {
        console.warn('Failed to geocode address:', geocodingError.message);
      } finally {
        setGeocodingLoading(false);
      }
    } else {
      setGeocodingLoading(false);
    }
  }, [handleLocationChange]);

  const handleSwitchToCheckIn = useCallback(() => {
    handleClose();
    if (onOpenCheckIn) onOpenCheckIn();
  }, [handleClose, onOpenCheckIn]);

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
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(107, 163, 208, 0.1)',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              color: '#6BA3D0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AssignmentIcon sx={{ color: '#6BA3D0' }} />
            Create Activity Plan
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

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.5,
              borderRadius: '999px',
              backgroundColor: 'rgba(107, 163, 208, 0.12)',
              border: '1px solid rgba(107, 163, 208, 0.2)',
            }}
          >
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#6BA3D0',
                '&:hover': { backgroundColor: '#5a8fb8' },
              }}
              disabled
            >
              Add Plan
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={handleSwitchToCheckIn}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                color: '#4e8ec2',
              }}
            >
              Check In
            </Button>
          </Box>
        </Box>

        {/* Error Dialog */}
        <AlertDialog
          open={errorDialog.open}
          onClose={() => setErrorDialog({ open: false, message: '', fieldType: '' })}
          message={errorDialog.message}
          severity="error"
          fieldType={errorDialog.fieldType}
        />

        {/* Success Dialog */}
        <AlertDialog
          open={successDialog.open}
          onClose={() => setSuccessDialog({ open: false, message: '' })}
          message={successDialog.message}
          severity="success"
        />

        {/* Date Input */}
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
            Date
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={formData.date}
            onChange={handleInputChange('date')}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: { xs: '8px', sm: '10px' },
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

        {/* Customer ID/Name */}
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
            Customer ID/Name
          </Typography>
          <Autocomplete
            options={customerOptions}
            getOptionLabel={(option) => {
              if (!option || typeof option !== 'object') return '';
              return option.nama || option.customer_name || '';
            }}
            value={formData.customer}
            inputValue={inputValue}
            onChange={handleCustomerChange}
            onInputChange={handleCustomerInputChange}
            loading={searchingCustomers}
            filterOptions={(x) => x} 
            isOptionEqualToValue={(option, value) => {
              try {
                if (!value || !option) return false;
                if (option.customer_id && value.customer_id) {
                  return String(option.customer_id) === String(value.customer_id);
                }
                if (option.nama && value.nama) {
                  return String(option.nama) === String(value.nama);
                }
                return false;
              } catch (error) {
                console.error('Error comparing options:', error);
                return false;
              }
            }}
            autoComplete={false} 
            clearOnBlur={false} 
            selectOnFocus={true}
            handleHomeEndKeys={true} 
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Cari atau pilih Customer (minimal 2 karakter)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: '8px', sm: '10px' },
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              if (!option || typeof option !== 'object') {
                return null;
              }
              
              const optionKey = option.customer_id || option.nama || option.id || Math.random();
              const customerName = option.nama || option.customer_name || '';
              const customerId = option.customer_id || option.id || '';
              const address = option.originalAddress || option.address1 || '';
              const city = option.city || '';
              const province = option.province || option.state || '';
              
              return (
                <Box
                  component="li"
                  {...props}
                  key={optionKey}
                  sx={{
                    py: 1.5,
                    px: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Box>
                    {customerName && (
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {customerName}
                      </Typography>
                    )}
                    {customerId && (
                      <Typography variant="caption" sx={{ color: '#999', mr: 1 }}>
                        ID: {customerId}
                      </Typography>
                    )}
                    {address && (
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                        {address}
                      </Typography>
                    )}
                    {(city || province) && (
                      <Typography variant="caption" sx={{ color: '#999', mt: 0.25 }}>
                        {[city, province].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
            noOptionsText={
              !searchInput || searchInput.trim().length < 2
                ? "Ketik minimal 2 karakter untuk mencari"
                : searchingCustomers
                ? "Mencari..."
                : "Tidak ada customer yang ditemukan"
            }
          />
        </Box>

        {/* Alamat dan Lokasi */}
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
            Alamat 
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Masukkan alamat lengkap..."
            value={customerAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: { xs: '8px', sm: '10px' },
                '&:hover fieldset': {
                  borderColor: '#6BA3D0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6BA3D0',
                },
              },
            }}
          />

          <Box sx={{
            height: '350px',
            borderRadius: { xs: '8px', sm: '10px' },
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            position: 'relative',
          }}>
            {geocodingLoading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 10,
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ color: '#6BA3D0', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Mencari lokasi customer...
                  </Typography>
                </Box>
              </Box>
            )}
            <AddressMap
              address={customerAddress}
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
            />
          </Box>

          {latitude && longitude && (
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                color: '#333',
                mt: 1,
                backgroundColor: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
              }}
            >
              Koordinat: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              {geocodingConfidence && (
                <span style={{
                  marginLeft: '8px',
                  color: geocodingConfidence === 'exact' ? '#2e7d32' :
                         geocodingConfidence === 'good' ? '#1976d2' : '#f57c00'
                }}>
                  ({geocodingConfidence === 'exact' ? '🎯 Lokasi tepat' :
                    geocodingConfidence === 'good' ? '📍 Lokasi baik' :
                    '⚠️ Lokasi perkiraan - geser marker untuk akurasi'})
                </span>
              )}
              {isDefaultLocation(latitude, longitude) && !geocodingConfidence && (
                <span style={{ color: '#d32f2f', marginLeft: '8px' }}>
                  (Geser marker untuk mengatur lokasi)
                </span>
              )}
            </Typography>
          )}
        </Box>

        {/* Tujuan */}
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
            Tujuan
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <ActivityTypeButton
              type="visit"
              label="Visit"
              selected={formData.tujuan === 'visit'}
              onClick={handleTujuanClick}
            />
            <ActivityTypeButton
              type="follow up"
              label="Follow Up"
              selected={formData.tujuan === 'follow up'}
              onClick={handleTujuanClick}
            />
          </Box>
        </Box>

        {/* Keterangan Tambahan */}
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
            Keterangan Tambahan
          </Typography>
          <TextareaAutosize
            minRows={4}
            placeholder="Masukkan keterangan tambahan..."
            value={formData.keterangan}
            onChange={handleInputChange('keterangan')}
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
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreatePlan}
            disabled={loading}
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
              'Create Plan'
            )}
          </Button>
        </Box>
      </Box>


      {/* Loading Plan Overlay */}
      {showLoadingPlan && <LoadingPlan />}
      </DialogContent>
    </Dialog>
  );
}

