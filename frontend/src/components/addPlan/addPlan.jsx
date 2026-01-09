// React
import React, { useState, useCallback, useEffect } from 'react';

// Material-UI Components
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Background import
import backgroundSvg from '../../media/2.svg';
import bgh1Svg from '../../media/bgh1.svg';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Custom imports
import { apiRequest } from '../../config/api';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';

// Plan components
import AddAddress from './addAddress';
import AddPlanFooter from './addPlanFooter';
import NewCustomer from './newCustomer/newCustomer';

// Constants
const ACTIVITY_TYPES = {
  VISIT: 'Visit',
  FOLLOW_UP: 'Follow Up',
};

const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 2;

// Transition Component
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Activity Type Button Component
const ActivityTypeButton = ({ type, label, selected, onClick }) => (
  <Button
    variant={selected ? 'contained' : 'outlined'}
    onClick={() => onClick(type)}
    fullWidth
    sx={{
      py: 1,
      fontSize: '0.875rem',
      fontWeight: 600,
      backgroundColor: selected ? '#6BA3D0' : 'white',
      color: selected ? 'white' : '#6BA3D0',
      borderColor: selected ? '#6BA3D0' : '#e2e8f0',
      borderWidth: '2px',
      borderRadius: 2,
      textTransform: 'none',
      boxShadow: selected ? '0 2px 8px rgba(107, 163, 208, 0.2)' : 'none',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: selected ? '#5a8fb8' : 'rgba(255, 255, 255, 0.9)',
        borderColor: '#6BA3D0',
        color: selected ? 'white' : '#6BA3D0',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(107, 163, 208, 0.15)',
      },
    }}
  >
    {label}
  </Button>
);

export default function AddPlan({ open, onClose }) {
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    customerId: '',
    customer: null,
    tujuan: '',
    keterangan: '',
  });

  // Search state
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Location state
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const { invalidateCache, fetchPlansByDate } = useActivityPlans();

  // Debounced customer search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput && searchInput.trim().length >= MIN_SEARCH_LENGTH) {
        searchCustomers(searchInput);
      } else {
        setCustomerOptions([]);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const searchCustomers = async (keyword) => {
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
  };

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

  // Customer selection callbacks
  const handleCustomerSelected = (customer) => {
    const fullAddress = buildFullAddress(customer);
    const customerId = customer.customer_id || customer.id || '';

    setFormData(prev => ({
      ...prev,
      customer,
      customerId,
    }));
    setCustomerAddress(fullAddress);
    setInputValue(customer.nama || customer.customer_name || '');
    setSearchInput('');
  };

  const handleCustomerCreated = (newCustomer) => {
    handleCustomerSelected(newCustomer);
    setNewCustomerDialogOpen(false);
  };

  const handleInputChange = useCallback((field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleCustomerChange = useCallback((event, newValue) => {
    try {
      if (!newValue) {
        setFormData(prev => ({
          ...prev,
          customer: null,
          customerId: '',
        }));
        setCustomerAddress('');
        setInputValue('');
        setSearchInput('');
        return;
      }

      const fullAddress = buildFullAddress(newValue);
      const customerId = newValue.customer_id || newValue.nama || '';
      const customerName = newValue.nama || '';

      setFormData(prev => ({
        ...prev,
        customer: newValue,
        customerId,
      }));
      setCustomerAddress(fullAddress);
      setInputValue(customerName);
      setSearchInput('');
    } catch (error) {
      console.error('Error handling customer change:', error);
      setError('Terjadi kesalahan saat memilih customer. Silakan coba lagi.');
      setFormData(prev => ({
        ...prev,
        customer: null,
        customerId: '',
      }));
      setCustomerAddress('');
      setInputValue('');
      setSearchInput('');
    }
  }, [buildFullAddress]);

  const handleCustomerInputChange = useCallback((event, newInputValue, reason) => {
    setInputValue(newInputValue);

    if (reason === 'input') {
      setSearchInput(newInputValue);
    } else if (reason === 'clear') {
      setSearchInput('');
      setFormData(prev => ({
        ...prev,
        customer: null,
        customerId: '',
      }));
      setCustomerAddress('');
    }
  }, []);

  const handleTujuanClick = useCallback((tujuan) => {
    setFormData(prev => ({ ...prev, tujuan }));
  }, []);

  const handleLocationChange = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const resetLocation = useCallback(() => {
    setLatitude(null);
    setLongitude(null);
  }, []);

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
        const errorData = await response.json().catch(() => ({}));

        let errorMessage = 'Gagal membuat activity plan';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
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
      setFormData({
        date: '',
        customerId: '',
        customer: null,
        tujuan: '',
        keterangan: '',
      });
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
          invalidateCache(formData.date);
          await fetchPlansByDate(formData.date, true);
        } catch (err) {
          console.error('Error refreshing cache:', err);
        }
      }

      // Dispatch custom event to trigger refresh in other components
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
    setFormData({
      date: '',
      customerId: '',
      customer: null,
      tujuan: '',
      keterangan: '',
    });
    setCustomerAddress('');
    resetLocation();
    setError('');
    setSuccess(false);
    setLoading(false);
    setSearchInput('');
    setInputValue('');
    onClose();
  }, [resetLocation, onClose]);

  const handleAddressConfirm = useCallback((addressData) => {
    if (addressData.address) {
      setCustomerAddress(addressData.address);
    }
  }, []);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          backgroundImage: `url(${backgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#ffffff',
        },
      }}
    >
      {/* Header AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundImage: `url(${bgh1Svg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '0 0 24px 24px',
          boxShadow: `
            0 12px 40px rgba(107, 163, 208, 0.3),
            0 6px 20px rgba(107, 163, 208, 0.2),
            0 3px 12px rgba(0, 0, 0, 0.12),
            0 1px 4px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(1.5px)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(107, 163, 208, 0.15) 0%, rgba(74, 144, 226, 0.1) 50%, rgba(107, 163, 208, 0.15) 100%)',
          },
        }}
      >
        <Toolbar
          sx={{
            position: 'relative',
            zIndex: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: { xs: '76px', sm: '84px' },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: '1rem', sm: '1.15rem' },
              fontWeight: 700,
              color: 'white',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12))',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '50px',
                height: '3px',
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
                borderRadius: '2px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Create Plan
          </Typography>

          {/* New Customer Button */}
          <Button
            onClick={() => setNewCustomerDialogOpen(true)}
            startIcon={<PersonAddIcon sx={{ fontSize: '1rem' }} />}
            sx={{
              py: 1,
              px: 2,
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 12px rgba(107, 163, 208, 0.2), 0 1px 4px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(107, 163, 208, 0.3), 0 2px 8px rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            New Customer
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(107, 163, 208, 0.3) transparent',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(107, 163, 208, 0.3)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(107, 163, 208, 0.5)',
              },
            },
          }}
        >
          <Container
            maxWidth="md"
            sx={{
              pt: 2,
              pb: { xs: 2, sm: 3 },
              px: { xs: 2, sm: 3 },
              mt: 1.5,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
              gap: 3,
            }}
          >
            {/* Success Message */}
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(false)}
                sx={{
                  borderRadius: 2,
                  mb: 2,
                  '& .MuiAlert-icon': {
                    color: '#059669',
                  },
                }}
              >
                Plan berhasil dibuat!
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{
                  borderRadius: 2,
                  mb: 2,
                  '& .MuiAlert-icon': {
                    color: '#dc2626',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            {/* Date Input */}
            <Box sx={{ mb: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#6BA3D0',
                  },
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
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Customer ID/Name */}
            <Box sx={{ mb: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#6BA3D0',
                  },
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
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          '& fieldset': {
                            borderColor: '#6BA3D0',
                            borderWidth: '2px',
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderColor: '#6BA3D0',
                            borderWidth: '2px',
                          },
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

            {/* Cari Lokasi Button */}
            <Box sx={{ mb: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#6BA3D0',
                  },
                }}
              >
                Cari Lokasi
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  if (!formData.customer) {
                    setError('Silakan pilih customer terlebih dahulu sebelum mencari lokasi');
                    return;
                  }
                  setAddAddressOpen(true);
                }}
                sx={{
                  py: 1.25,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderColor: '#6BA3D0',
                  color: '#6BA3D0',
                  borderRadius: 2,
                  textTransform: 'none',
                  borderStyle: latitude && longitude ? 'solid' : 'dashed',
                  borderWidth: latitude && longitude ? '2px' : '2px',
                  backgroundColor: latitude && longitude ? 'rgba(107, 163, 208, 0.08)' : 'rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#5a8fb8',
                    backgroundColor: latitude && longitude ? 'rgba(107, 163, 208, 0.12)' : '#f1f5f9',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(107, 163, 208, 0.15)',
                  },
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af',
                    backgroundColor: '#f9fafb',
                  },
                }}
              >
                {latitude && longitude
                  ? `Lokasi Terpilih: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : formData.customer
                    ? 'Klik untuk memilih lokasi'
                    : 'Pilih customer terlebih dahulu untuk mencari lokasi'
                }
              </Button>
            </Box>

            {/* Tujuan */}
            <Box sx={{ mb: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#6BA3D0',
                  },
                }}
              >
                Tujuan
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
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
            <Box sx={{ mb: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#6BA3D0',
                  },
                }}
              >
                Keterangan Tambahan
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Masukkan keterangan tambahan..."
                value={formData.keterangan}
                onChange={handleInputChange('keterangan')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#6BA3D0',
                        borderWidth: '2px',
                      },
                    },
                  },
                }}
              />
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <AddPlanFooter
          onCancel={handleClose}
          onCreate={handleCreatePlan}
          loading={loading}
          createDisabled={!formData.date || !formData.customerId || !formData.customer || !formData.tujuan}
        />
      </Box>

      {/* Add Address Component */}
      <AddAddress
        open={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        customerAddress={customerAddress || ''}
        onLocationChange={handleLocationChange}
        onAddressConfirm={handleAddressConfirm}
      />

      {/* New Customer Dialog */}
      <NewCustomer
        open={newCustomerDialogOpen}
        onClose={() => setNewCustomerDialogOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

    </Dialog>
  );
}