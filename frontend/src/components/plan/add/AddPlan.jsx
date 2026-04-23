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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Material-UI Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Custom imports
import { apiRequest } from '../../../services/api';
import { AlertDialog } from '../feedback';
import { useActivityPlans } from '../../../contexts/ActivityPlanContext';

// Utilities
import { parse, format } from 'date-fns';
import { getCoordinatesFromAddressEnhanced } from '../../../utils/geocoding';

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
const MASTER_ADDRESS_ID = 'master';

const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

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
      backgroundColor: selected ? 'var(--theme-blue-primary)' : 'transparent',
      color: selected ? 'white' : 'var(--theme-blue-primary)',
      borderColor: 'var(--theme-blue-primary)',
      borderRadius: { xs: '8px', sm: '10px' },
      textTransform: 'none',
      '&:hover': {
        backgroundColor: selected ? 'var(--theme-blue-overlay)' : 'rgba(31, 78, 140, 0.08)',
        borderColor: 'var(--theme-blue-primary)',
        color: selected ? 'white' : 'var(--theme-blue-primary)',
      },
    }}
  >
    {label}
  </Button>
);

// Custom Hooks
const useFormState = () => {
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    customerId: '',
    customer: null,
    customerAddressId: MASTER_ADDRESS_ID,
    tujuan: '',
    keterangan: '',
  });

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      date: getTodayDateString(),
      customerId: '',
      customer: null,
      customerAddressId: MASTER_ADDRESS_ID,
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

export default function AddPlan({
  open,
  onClose,
  onCloseAfterSuccess,
  onOpenAddAddress,
  addressSelection,
  initialTujuan = '',
  title = 'Create Activity Plan',
  lockTujuan = false,
  disableAddressEdit = false,
  disableGeocoding = false,
  centerHeader = false,
  headerIcon: HeaderIcon = AssignmentIcon,
}) {
  // UI State
  const [loading, setLoading] = useState(false);
  const [showLoadingPlan, setShowLoadingPlan] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '', fieldType: '' });
  const [successDialog, setSuccessDialog] = useState({ open: false, message: '' });
  const [confirmationDialog, setConfirmationDialog] = useState({ open: false, message: '' });
  const [saveAddressDialog, setSaveAddressDialog] = useState({ open: false, message: '' });

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
  const minSelectableDate = new Date();
  minSelectableDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (open) {
      updateField('date', getTodayDateString());
    }
  }, [open, updateField]);

  useEffect(() => {
    if (!open) return;
    if (initialTujuan === 'visit' || initialTujuan === 'follow up') {
      updateField('tujuan', initialTujuan);
    }
  }, [open, initialTujuan, updateField]);

  useEffect(() => {
    if (!open || !addressSelection) return;

    const hasAddress = typeof addressSelection.address === 'string';
    const hasCoordinates =
      Number.isFinite(addressSelection.latitude) && Number.isFinite(addressSelection.longitude);
    const selectedAddressId = addressSelection.addressId || MASTER_ADDRESS_ID;

    if (hasAddress) {
      setCustomerAddress(addressSelection.address);
    }

    if (hasCoordinates) {
      handleLocationChange(addressSelection.latitude, addressSelection.longitude);
    }

    updateField('customerAddressId', selectedAddressId);
  }, [open, addressSelection, handleLocationChange, setCustomerAddress, updateField]);

  const handleInputChange = useCallback((field) => (event) => {
    updateField(field, event.target.value);
  }, [updateField]);

  const handleDateChange = useCallback((newValue) => {
    if (!newValue || !(newValue instanceof Date) || Number.isNaN(newValue.getTime())) {
      updateField('date', '');
      return;
    }
    updateField('date', format(newValue, 'yyyy-MM-dd'));
  }, [updateField]);

  const handleCustomerChange = useCallback(async (event, newValue) => {
    try {
      if (!newValue) {
        updateField('customer', null);
        updateField('customerId', '');
        updateField('customerAddressId', MASTER_ADDRESS_ID);
        setCustomerAddress('');
        setInputValue('');
        setSearchInput('');
        // Reset location when customer is cleared
        resetLocation();
        return;
      }

      const fullAddress = buildFullAddress(newValue);
      const customerId = newValue.customer_id || newValue.nama || '';
      const customerName = newValue.nama || '';

      updateField('customer', newValue);
      updateField('customerId', customerId);
      updateField('customerAddressId', MASTER_ADDRESS_ID);
      setCustomerAddress(fullAddress);
      setInputValue(customerName);
      setSearchInput('');

      // Geocode the customer address if it exists and geocoding is not disabled
      if (fullAddress && fullAddress.trim() && !disableGeocoding) {
        setGeocodingLoading(true);
        try {
          const geocodingResult = await getCoordinatesFromAddressEnhanced(fullAddress);
          const { lat, lng, confidence } = geocodingResult;

          // Update location coordinates
          handleLocationChange(lat, lng);

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
      updateField('customerAddressId', MASTER_ADDRESS_ID);
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
      updateField('customerAddressId', MASTER_ADDRESS_ID);
      setCustomerAddress('');
    }
  }, [updateField]);


  const handleTujuanClick = useCallback((tujuan) => {
    if (lockTujuan) return;
    updateField('tujuan', tujuan);
  }, [lockTujuan, updateField]);


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
    const planDate = parse(formData.date, 'yyyy-MM-dd', new Date());
    planDate.setHours(0, 0, 0, 0);

    if (planDate < today) {
      setErrorDialog({ open: true, message: 'Tanggal harus sama dengan atau setelah hari ini', fieldType: 'date' });
      return;
    }

    // Validasi koordinat hanya untuk visit
    if (formData.tujuan === 'visit') {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setErrorDialog({ open: true, message: 'Lokasi belum ditentukan. Geser marker pada peta untuk menentukan lokasi.', fieldType: 'location' });
        return;
      }

      if (isDefaultLocation(latitude, longitude)) {
        setConfirmationDialog({ open: true, message: 'Lokasi di luar jangkauan. Lanjutkan?' });
        return;
      }
    }

    proceedToCreatePlan();
  };

  const proceedToCreatePlan = async () => {
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
        customer_address_id: formData.customerAddressId || MASTER_ADDRESS_ID,
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
      if (typeof onCloseAfterSuccess === 'function') {
        onCloseAfterSuccess();
      } else {
        onClose();
      }

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

  const handleConfirmContinue = useCallback(() => {
    setConfirmationDialog({ open: false });
    setSaveAddressDialog({ open: true, message: 'Simpan alamat atau tidak?' });
  }, []);

  const handleConfirmSaveAddress = useCallback((save) => {
    setSaveAddressDialog({ open: false });
    // If save, logic to save address can be added here
    // For now, proceed to create plan
    proceedToCreatePlan();
  }, []);

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
    setConfirmationDialog({ open: false, message: '' });
    setSaveAddressDialog({ open: false, message: '' });
    setLoading(false);
    setShowLoadingPlan(false);
    setGeocodingLoading(false);
    setSearchInput('');
    setInputValue('');
    onClose();
  }, [resetForm, resetLocation, onClose]);

  const handleOpenAddressPage = useCallback(() => {
    if (disableAddressEdit) return;
    if (!onOpenAddAddress) return;
    if (!formData.customerId) {
      setErrorDialog({ open: true, message: 'Pilih customer terlebih dahulu sebelum mengatur alamat.', fieldType: 'customer' });
      return;
    }

    const originalAddressFromCustomer = formData.customer ? buildFullAddress(formData.customer) : '';

    onOpenAddAddress({
      customerId: formData.customerId || '',
      addressId: formData.customerAddressId || MASTER_ADDRESS_ID,
      address: customerAddress || '',
      originalAddress: originalAddressFromCustomer || customerAddress || '',
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
    });
  }, [disableAddressEdit, onOpenAddAddress, customerAddress, latitude, longitude, formData.customer, formData.customerId, formData.customerAddressId, buildFullAddress]);

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
          maxHeight: fullScreen ? '100%' : '96vh',
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid rgba(31, 78, 140, 0.1)',
            gap: 1,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              fontWeight: 700,
              color: 'var(--theme-blue-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: centerHeader ? 'center' : 'flex-start',
              gap: 1,
              flex: 1,
            }}
          >
            {HeaderIcon ? <HeaderIcon sx={{ color: 'var(--theme-blue-primary)' }} /> : null}
            {title}
          </Typography>
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

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmationDialog.open}
          onClose={() => setConfirmationDialog({ open: false })}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              p: 2,
            },
          }}
        >
          <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Konfirmasi
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {confirmationDialog.message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setConfirmationDialog({ open: false })}
                sx={{
                  borderColor: 'var(--theme-blue-primary)',
                  color: 'var(--theme-blue-primary)',
                  borderRadius: '8px',
                  px: 3,
                  '&:hover': {
                    borderColor: 'var(--theme-blue-overlay)',
                    backgroundColor: 'rgba(31, 78, 140, 0.08)',
                  },
                }}
              >
                Batal
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmContinue}
                sx={{
                  backgroundColor: 'var(--theme-blue-primary)',
                  color: 'white',
                  borderRadius: '8px',
                  px: 3,
                  '&:hover': {
                    backgroundColor: 'var(--theme-blue-overlay)',
                  },
                }}
              >
                Lanjutkan
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Save Address Dialog */}
        <Dialog
          open={saveAddressDialog.open}
          onClose={() => setSaveAddressDialog({ open: false })}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              p: 2,
            },
          }}
        >
          <DialogContent sx={{ textAlign: 'center', pb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Konfirmasi Alamat
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {saveAddressDialog.message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => handleConfirmSaveAddress(false)}
                sx={{
                  borderColor: 'var(--theme-blue-primary)',
                  color: 'var(--theme-blue-primary)',
                  borderRadius: '8px',
                  px: 3,
                  '&:hover': {
                    borderColor: 'var(--theme-blue-overlay)',
                    backgroundColor: 'rgba(31, 78, 140, 0.08)',
                  },
                }}
              >
                Tidak
              </Button>
              <Button
                variant="contained"
                onClick={() => handleConfirmSaveAddress(true)}
                sx={{
                  backgroundColor: 'var(--theme-blue-primary)',
                  color: 'white',
                  borderRadius: '8px',
                  px: 3,
                  '&:hover': {
                    backgroundColor: 'var(--theme-blue-overlay)',
                  },
                }}
              >
                Ya
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

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
          <DatePicker
            value={formData.date ? parse(formData.date, 'yyyy-MM-dd', new Date()) : null}
            onChange={handleDateChange}
            format="yyyy-MM-dd"
            minDate={minSelectableDate}
            slots={{ openPickerIcon: CalendarTodayIcon }}
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: 'YYYY-MM-DD',
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: '8px', sm: '10px' },
                    '&:hover fieldset': {
                      borderColor: 'var(--theme-blue-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--theme-blue-primary)',
                    },
                  },
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
                placeholder="Search or select Customer (minimum 2 characters)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: '8px', sm: '10px' },
                    '&:hover fieldset': {
                      borderColor: 'var(--theme-blue-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--theme-blue-primary)',
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

        {/* Alamat dan Maps */}
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
            Customer Address
          </Typography>

          {!disableAddressEdit && (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleOpenAddressPage}
              startIcon={geocodingLoading ? <CircularProgress size={18} /> : <LocationOnIcon />}
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                borderColor: 'var(--theme-blue-primary)',
                color: 'var(--theme-blue-primary)',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                fontWeight: 700,
                justifyContent: 'flex-start',
                '&:hover': {
                  borderColor: 'var(--theme-blue-overlay)',
                  backgroundColor: 'rgba(31, 78, 140, 0.06)',
                },
              }}
            >
              Open Address & Maps Page
            </Button>
          )}

          {customerAddress?.trim() && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: '#666',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              }}
            >
              Address: {customerAddress}
            </Typography>
          )}

          {latitude && longitude && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                color: '#1f4e8c',
                fontWeight: 600,
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              }}
            >
              Koordinat: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Typography>
          )}
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
            Additional Notes (Optional)
          </Typography>
          <TextareaAutosize
            minRows={5}
            placeholder="Enter additional information..."
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
              e.target.style.borderColor = 'var(--theme-blue-primary)';
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
              borderColor: 'var(--theme-blue-primary)',
              color: 'var(--theme-blue-primary)',
              borderRadius: { xs: '8px', sm: '10px' },
              textTransform: 'none',
              '&:hover': {
                borderColor: 'var(--theme-blue-overlay)',
                backgroundColor: 'rgba(31, 78, 140, 0.08)',
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
              backgroundColor: 'var(--theme-blue-primary)',
              color: 'white',
              borderRadius: { xs: '8px', sm: '10px' },
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'var(--theme-blue-overlay)',
                color: 'white',
              },
              '&:disabled': {
                backgroundColor: 'var(--theme-blue-primary)',
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
      {showLoadingPlan && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10, 18, 34, 0.7)',
          }}
        >
          <CircularProgress
            size={52}
            thickness={4.5}
            sx={{ color: '#FFFFFF' }}
          />
        </Box>
      )}
      </DialogContent>
    </Dialog>
  );
}



