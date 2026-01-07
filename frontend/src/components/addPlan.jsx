// React
import React, { useState, useEffect, useCallback, memo } from 'react';

// Material-UI Components
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';

// Custom imports
import { apiRequest } from '../config/api';
import AddressMap from './AddressMap';
import { useActivityPlans } from '../contexts/ActivityPlanContext';

// Utilities
import { parse } from 'date-fns';

// Constants
const ACTIVITY_TYPES = {
  VISIT: 'Visit',
  FOLLOW_UP: 'Follow Up',
};

const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 2;
const DEFAULT_COORDINATES = {
  LAT: -6.2088,
  LNG: 106.8456,
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

export default function AddPlan({ open, onClose }) {
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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


  const handleInputChange = useCallback((field) => (event) => {
    updateField(field, event.target.value);
  }, [updateField]);

  const handleCustomerChange = useCallback((event, newValue) => {
    try {
      if (!newValue) {
        updateField('customer', null);
        updateField('customerId', '');
        setCustomerAddress('');
        setInputValue('');
        setSearchInput('');
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
    } catch (error) {
      console.error('Error handling customer change:', error);
      setError('Terjadi kesalahan saat memilih customer. Silakan coba lagi.');
      updateField('customer', null);
      updateField('customerId', '');
      setCustomerAddress('');
      setInputValue('');
      setSearchInput('');
    }
  }, [updateField, buildFullAddress]);

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
      setError('Tanggal harus diisi');
      return;
    }
    if (!formData.customerId || !formData.customer) {
      setError('Customer harus dipilih');
      return;
    }
    if (!formData.tujuan) {
      setError('Tujuan harus dipilih');
      return;
    }

    // Validasi tanggal harus >= hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planDate = new Date(formData.date);
    planDate.setHours(0, 0, 0, 0);
    
    if (planDate < today) {
      setError('Tanggal harus sama dengan atau setelah hari ini');
      return;
    }

    // Validasi koordinat
    if (!latitude || !longitude) {
      setError('Koordinat lokasi belum ditentukan. Silakan tunggu geocoding selesai atau geser marker pada peta untuk menentukan lokasi secara manual.');
      return;
    }

    if (isDefaultLocation(latitude, longitude)) {
      setError('Koordinat masih di lokasi default. Silakan geser marker pada peta ke lokasi yang sesuai, atau cari lokasi menggunakan fitur pencarian.');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Map tujuan ke format yang benar
      const tujuanFormatted = formData.tujuan === 'visit' ? ACTIVITY_TYPES.VISIT :
                             formData.tujuan === 'follow up' ? ACTIVITY_TYPES.FOLLOW_UP :
                             formData.tujuan;

      // Prepare request body sesuai API spec
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
        
        setError(errorMessage);
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
      setSuccess(false);
      setError('');

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
      setError('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    resetForm();
    setCustomerAddress('');
    resetLocation();
    setError('');
    setSuccess(false);
    setLoading(false);
    setSearchInput('');
    setInputValue('');
    onClose();
  }, [resetForm, resetLocation, onClose]);

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

        {/* Error Message */}
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Success Message */}
        {success && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">Plan berhasil dibuat!</Alert>
          </Box>
        )}

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

        {/* Cari Lokasi - OpenStreetMap */}
        <AddressMap
          address={customerAddress}
          onLocationChange={handleLocationChange}
        />

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
    </Drawer>
  );
}

