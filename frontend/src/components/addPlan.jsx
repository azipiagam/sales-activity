import React, { useState, useEffect, useCallback, memo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { apiRequest } from '../config/api';
import AddressMap from './AddressMap';
import { getCoordinatesFromAddress } from '../utils/geocoding';
import { useActivityPlans } from '../contexts/ActivityPlanContext';
import { parse } from 'date-fns';

export default function AddPlan({ open, onClose }) {
  const [formData, setFormData] = useState({
    date: '',
    customerId: '',
    customer: null,
    alamat: '',
    tujuan: '',
    keterangan: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const { invalidateCache, fetchPlansByDate } = useActivityPlans();
  
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const searchCustomers = useCallback(async (keyword) => {
    if (!keyword || keyword.trim().length < 2) {
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

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
      
      let mappedCustomers = [];
      
      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          mappedCustomers = data.map(customer => {
            if (!customer) return null;
            return {
              customer_id: customer.id || customer.customer_id || '', // Backend menggunakan 'id'
              nama: customer.customer_name || '',
              address1: customer.address || '',
              city: customer.city || '',
              province: customer.state || customer.province || '', // Backend menggunakan 'state'
              company_name: customer.company_name || '',
              phone: customer.phone || '',
              email: customer.email || '',
              // Simpan data asli untuk referensi
              originalAddress: customer.address || '',
            };
          }).filter(Boolean); // Filter out null values
        }
      }
      setCustomerOptions(mappedCustomers);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerOptions([]);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  useEffect(() => {
    // Debounce search untuk mengurangi API calls
    const timeoutId = setTimeout(() => {
      if (searchInput && searchInput.trim().length >= 2) {
        searchCustomers(searchInput);
      } else {
        setCustomerOptions([]);
      }
    }, 500); // Increased debounce time untuk mengurangi API calls

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchCustomers]);

  const buildFullAddress = (customer) => {
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
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleCustomerChange = (event, newValue) => {
    try {
      if (!newValue) {
        setFormData({
          ...formData,
          customer: null,
          customerId: '',
          alamat: '',
        });
        setInputValue('');
        setSearchInput('');
        return;
      }

      const fullAddress = buildFullAddress(newValue);
      
      const customerId = newValue.customer_id || newValue.nama || '';
      const customerName = newValue.nama || '';
      
      setFormData({
        ...formData,
        customer: newValue,
        customerId: customerId,
        alamat: fullAddress,
      });
      
      // Set input value ke nama customer yang dipilih
      setInputValue(customerName);
      setSearchInput(''); 
    } catch (error) {
      console.error('Error handling customer change:', error);
      setError('Terjadi kesalahan saat memilih customer. Silakan coba lagi.');
      // Reset state jika error
      setFormData({
        ...formData,
        customer: null,
        customerId: '',
        alamat: '',
      });
      setInputValue('');
      setSearchInput('');
    }
  };

  const handleCustomerInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);
    
    if (reason === 'input') {
      setSearchInput(newInputValue);
    } else if (reason === 'clear') {
      setSearchInput('');
      setFormData({
        ...formData,
        customer: null,
        customerId: '',
        alamat: '',
      });
    }
  };


  const handleTujuanClick = (tujuan) => {
    setFormData({
      ...formData,
      tujuan: tujuan,
    });
  };


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

    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Map tujuan ke format yang benar (Visit atau Follow Up)
      const tujuanMap = {
        'visit': 'Visit',
        'follow up': 'Follow Up',
        'Visit': 'Visit',
        'Follow Up': 'Follow Up',
      };
      const tujuanFormatted = tujuanMap[formData.tujuan] || formData.tujuan;

      // Prepare request body sesuai API spec
      const requestBody = {
        customer_id: formData.customerId,
        customer_name: formData.customer.nama || '',
        plan_date: formData.date,
        tujuan: tujuanFormatted,
        keterangan_tambahan: formData.keterangan || '',
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
      setFormData({
        date: '',
        customerId: '',
        customer: null,
        alamat: '',
        tujuan: '',
        keterangan: '',
      });
      setSearchInput('');
      setInputValue('');
      setCustomerOptions([]);
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

  const handleClose = () => {
    setFormData({
      date: '',
      customerId: '',
      customer: null,
      alamat: '',
      tujuan: '',
      keterangan: '',
    });
    setError('');
    setSuccess(false);
    setLoading(false);
    setCustomerOptions([]);
    setSearchInput('');
    setInputValue('');
    onClose();
  };

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

        {/* Alamat */}
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
            placeholder="Alamat akan otomatis terisi saat memilih customer"
            value={formData.alamat}
            onChange={handleInputChange('alamat')}
            multiline
            minRows={2}
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

        {/* Google Maps - Tampilkan jika alamat sudah terisi */}
        <AddressMap address={formData.alamat} />

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
            <Button
              variant={formData.tujuan === 'visit' ? 'contained' : 'outlined'}
              onClick={() => handleTujuanClick('visit')}
              fullWidth
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                fontWeight: 600,
                backgroundColor:
                  formData.tujuan === 'visit' ? '#6BA3D0' : 'transparent',
                color:
                  formData.tujuan === 'visit' ? 'white' : '#6BA3D0',
                borderColor: '#6BA3D0',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  backgroundColor:
                    formData.tujuan === 'visit'
                      ? '#5a8fb8'
                      : 'rgba(107, 163, 208, 0.08)',
                  borderColor: '#6BA3D0',
                  color:
                    formData.tujuan === 'visit' ? 'white' : '#6BA3D0',
                },
              }}
            >
              Visit
            </Button>
            <Button
              variant={formData.tujuan === 'follow up' ? 'contained' : 'outlined'}
              onClick={() => handleTujuanClick('follow up')}
              fullWidth
              sx={{
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                fontWeight: 600,
                backgroundColor:
                  formData.tujuan === 'follow up' ? '#6BA3D0' : 'transparent',
                color:
                  formData.tujuan === 'follow up' ? 'white' : '#6BA3D0',
                borderColor: '#6BA3D0',
                borderRadius: { xs: '8px', sm: '10px' },
                textTransform: 'none',
                '&:hover': {
                  backgroundColor:
                    formData.tujuan === 'follow up'
                      ? '#5a8fb8'
                      : 'rgba(107, 163, 208, 0.08)',
                  borderColor: '#6BA3D0',
                  color:
                    formData.tujuan === 'follow up' ? 'white' : '#6BA3D0',
                },
              }}
            >
              Follow Up
            </Button>
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

