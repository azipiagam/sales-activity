import React, { useState, useEffect, useCallback } from 'react';
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

  // Fungsi untuk mencari customer dari API
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
      
      // Debug: log response untuk troubleshooting
      console.log('API Response:', data);
      console.log('Is Array:', Array.isArray(data));
      console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
      
      // Map response API ke format yang digunakan di form
      // Backend mengembalikan sesuai dokumentasi: customer_id, customer_name, address
      // Plus field tambahan: city, state, company_name, phone, email
      let mappedCustomers = [];
      
      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          mappedCustomers = data.map(customer => {
            if (!customer) return null;
            return {
              customer_id: customer.customer_id || '', // Sesuai dokumentasi API
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
      } else {
        console.warn('Response is not an array:', typeof data, data);
      }
      
      console.log('Mapped Customers:', mappedCustomers);
      setCustomerOptions(mappedCustomers);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerOptions([]);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  // Debounce function untuk search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput) {
        searchCustomers(searchInput);
      } else {
        setCustomerOptions([]);
      }
    }, 300); // Delay 300ms untuk debounce

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchCustomers]);

  // Fungsi untuk membuat alamat lengkap dari customer
  const buildFullAddress = (customer) => {
    if (!customer) return '';
    // Jika ada originalAddress (dari API), gunakan itu
    if (customer.originalAddress) {
      return customer.originalAddress;
    }
    // Fallback ke format lama
    const parts = [
      customer.address1,
      customer.city,
      customer.province
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleCustomerChange = (event, newValue) => {
    const fullAddress = buildFullAddress(newValue);
    setFormData({
      ...formData,
      customer: newValue,
      customerId: newValue ? (newValue.customer_id || newValue.nama) : '',
      alamat: fullAddress,
    });
  };

  const handleCustomerInputChange = (event, newInputValue) => {
    setSearchInput(newInputValue);
  };

  // Fungsi untuk mendapatkan Google Maps URL
  const getGoogleMapsUrl = (address) => {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address);
    
    // Menggunakan Google Maps Embed API jika API key tersedia
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;
    }
    
    // Fallback: menggunakan Google Maps dengan format embed sederhana
    // Format ini bekerja tanpa API key untuk basic embedding
    return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const handleTujuanClick = (tujuan) => {
    setFormData({
      ...formData,
      tujuan: tujuan,
    });
  };

  // Fungsi untuk mendapatkan koordinat dari alamat menggunakan OpenStreetMap Nominatim API
  const getCoordinatesFromAddress = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'AbsensiSalesApp/1.0', // Required by Nominatim
          },
        }
      );

      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  // Fungsi untuk menyimpan data plan ke server API dan localStorage
  const savePlanToStorage = async (planData) => {
    try {
      // Coba simpan ke server API terlebih dahulu
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      try {
        const response = await fetch(`${API_URL}/api/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(planData),
        });

        if (!response.ok) {
          throw new Error('Failed to save to server');
        }

        const result = await response.json();
        
        // Jika berhasil disimpan ke server, update localStorage juga
        const existingData = localStorage.getItem('simpanPlan');
        let plans = [];

        if (existingData) {
          try {
            plans = JSON.parse(existingData);
            if (!Array.isArray(plans)) {
              plans = [];
            }
          } catch (e) {
            plans = [];
          }
        }

        plans.push(result.plan);
        localStorage.setItem('simpanPlan', JSON.stringify(plans, null, 2));

        return true;
      } catch (apiError) {
        // Jika API gagal, fallback ke localStorage saja
        console.warn('API tidak tersedia, menggunakan localStorage:', apiError);
        
        const existingData = localStorage.getItem('simpanPlan');
        let plans = [];

        if (existingData) {
          try {
            plans = JSON.parse(existingData);
            if (!Array.isArray(plans)) {
              plans = [];
            }
          } catch (e) {
            plans = [];
          }
        }

        const newPlan = {
          id: Date.now().toString(),
          ...planData,
          createdAt: new Date().toISOString(),
        };

        plans.push(newPlan);
        localStorage.setItem('simpanPlan', JSON.stringify(plans, null, 2));

        return true;
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      return false;
    }
  };

  // Handler untuk submit form
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
    if (!formData.alamat) {
      setError('Alamat harus diisi');
      return;
    }
    if (!formData.tujuan) {
      setError('Tujuan harus dipilih');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Dapatkan koordinat dari alamat
      const coordinates = await getCoordinatesFromAddress(formData.alamat);

      // Siapkan data untuk disimpan
      const planDataToSave = {
        date: formData.date,
        customerId: formData.customerId,
        customer: {
          customer_id: formData.customer.customer_id || null,
          nama: formData.customer.nama,
          address1: formData.customer.address1 || formData.customer.originalAddress || '',
          city: formData.customer.city || '',
          province: formData.customer.province || '',
          originalAddress: formData.customer.originalAddress || '',
        },
        alamat: formData.alamat,
        coordinates: coordinates || null, // Simpan koordinat (lat, lng) atau null jika tidak ditemukan
        tujuan: formData.tujuan,
        keterangan: formData.keterangan || '',
      };

      // Simpan ke server API dan localStorage
      const saved = await savePlanToStorage(planDataToSave);

      if (saved) {
        setSuccess(true);
        // Reset form
        setFormData({
          date: '',
          customerId: '',
          customer: null,
          alamat: '',
          tujuan: '',
          keterangan: '',
        });

        // Tutup drawer setelah 1.5 detik
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError('Gagal menyimpan data plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      setError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  // Reset form dan state saat drawer ditutup
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
            getOptionLabel={(option) => option.nama || ''}
            value={formData.customer}
            onChange={handleCustomerChange}
            onInputChange={handleCustomerInputChange}
            loading={searchingCustomers}
            isOptionEqualToValue={(option, value) => 
              option.customer_id === value?.customer_id || option.nama === value?.nama
            }
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
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{
                  py: 1.5,
                  px: 2,
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {option.nama}
                  </Typography>
                  {option.customer_id && (
                    <Typography variant="caption" sx={{ color: '#999', mr: 1 }}>
                      ID: {option.customer_id}
                    </Typography>
                  )}
                  {(option.originalAddress || option.address1) && (
                    <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                      {option.originalAddress || option.address1}
                    </Typography>
                  )}
                  {(option.city || option.province) && (
                    <Typography variant="caption" sx={{ color: '#999', mt: 0.25 }}>
                      {[option.city, option.province].filter(Boolean).join(', ')}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
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
          {formData.alamat && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#666',
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Peta Lokasi
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: { xs: '250px', sm: '300px' },
                  borderRadius: { xs: '8px', sm: '10px' },
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                }}
              >
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={getGoogleMapsUrl(formData.alamat)}
                  title="Map Location"
                />
              </Box>
            </Box>
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

