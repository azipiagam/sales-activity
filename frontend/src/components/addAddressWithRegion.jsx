import React, { useState, useEffect, useCallback } from 'react';

// Material-UI Components
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Custom imports
import AddressMap from './AddressMap';

// Constants
const DEFAULT_COORDINATES = {
  LAT: -6.2088,
  LNG: 106.8456,
  TOLERANCE: 0.0001,
};

export default function AddAddressWithRegion({
  open,
  onClose,
  customerAddress = '',
  onLocationChange,
  onAddressConfirm
}) {
  // State untuk lokasi
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(customerAddress);

  // State untuk alamat detail
  const [addressDetails, setAddressDetails] = useState({
    street: '',
    province: '',
    regency: '',
    district: '',
    postalCode: ''
  });

  // Set initial address dari customer
  useEffect(() => {
    if (customerAddress && customerAddress.trim()) {
      setSelectedAddress(customerAddress.trim());
    }
  }, [customerAddress]);

  const handleLocationChange = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);


  const handleAddressDetailsChange = useCallback((field) => (event) => {
    setAddressDetails(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  }, []);


  // Generate full address dari input manual
  const generateFullAddress = useCallback(() => {
    const parts = [];

    // Tambahkan alamat jalan
    if (addressDetails.street.trim()) {
      parts.push(addressDetails.street.trim());
    }

    // Tambahkan region dari manual input
    if (addressDetails.district.trim()) {
      parts.push(addressDetails.district.trim());
    }
    if (addressDetails.regency.trim()) {
      parts.push(addressDetails.regency.trim());
    }
    if (addressDetails.province.trim()) {
      parts.push(addressDetails.province.trim());
    }

    // Tambahkan kode pos
    if (addressDetails.postalCode.trim()) {
      parts.push(addressDetails.postalCode.trim());
    }

    return parts.join(', ');
  }, [addressDetails]);

  const handleConfirm = useCallback(() => {
    // Validasi koordinat
    if (!latitude || !longitude) {
      return;
    }

    // Generate full address
    const fullAddress = generateFullAddress();

    // Panggil callback dengan data lengkap
    if (onLocationChange) {
      onLocationChange(latitude, longitude);
    }

    if (onAddressConfirm) {
      onAddressConfirm({
        address: fullAddress || selectedAddress,
        latitude,
        longitude,
        region: {
          province: addressDetails.province?.trim(),
          regency: addressDetails.regency?.trim(),
          district: addressDetails.district?.trim(),
        },
        details: {
          street: addressDetails.street?.trim(),
          postalCode: addressDetails.postalCode?.trim()
        }
      });
    }

    onClose();
  }, [latitude, longitude, selectedAddress, selectedRegion, addressDetails, onLocationChange, onAddressConfirm, onClose, generateFullAddress]);

  const handleClose = useCallback(() => {
    // Reset state saat close
    setAddressDetails({
      street: '',
      province: '',
      regency: '',
      district: '',
      postalCode: ''
    });
    onClose();
  }, [onClose]);

  const isDefaultLocation = useCallback((lat, lng) => {
    return Math.abs(lat - DEFAULT_COORDINATES.LAT) < DEFAULT_COORDINATES.TOLERANCE &&
           Math.abs(lng - DEFAULT_COORDINATES.LNG) < DEFAULT_COORDINATES.TOLERANCE;
  }, []);

  const isFormValid = latitude && longitude && addressDetails.province?.trim() && addressDetails.regency?.trim();

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
            Pilih Lokasi & Wilayah
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

        {/* Customer Address Display */}
        {customerAddress && (
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
              Alamat Customer Saat Ini
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
                color: '#333',
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              {customerAddress}
            </Typography>
          </Box>
        )}

        {/* Input Fields untuk Alamat Lengkap */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 2,
              fontWeight: 600,
            }}
          >
            Detail Alamat Lengkap
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Jalan / Nomor Rumah"
                placeholder="Jl. Sudirman No. 123, RT/RW 01/02"
                value={addressDetails.street}
                onChange={handleAddressDetailsChange('street')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kecamatan"
                placeholder="Contoh: Tanah Abang"
                value={addressDetails.district}
                onChange={handleAddressDetailsChange('district')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kota/Kabupaten"
                placeholder="Contoh: Jakarta Pusat"
                value={addressDetails.regency}
                onChange={handleAddressDetailsChange('regency')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Provinsi"
                placeholder="Contoh: DKI Jakarta"
                value={addressDetails.province}
                onChange={handleAddressDetailsChange('province')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kode Pos"
                placeholder="12345"
                value={addressDetails.postalCode}
                onChange={handleAddressDetailsChange('postalCode')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#6BA3D0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6BA3D0',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Generated Address Preview */}
        {(addressDetails.street || addressDetails.district || addressDetails.regency || addressDetails.province) && (
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
              Alamat Lengkap (Preview)
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
                color: '#333',
                backgroundColor: '#e3f2fd',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #6BA3D0',
                minHeight: '60px',
              }}
            >
              {generateFullAddress() || 'Alamat akan muncul di sini...'}
            </Typography>
          </Box>
        )}

        {/* Map Component */}
        <AddressMap
          address={generateFullAddress() || customerAddress}
          onLocationChange={handleLocationChange}
        />

        {/* Location Info */}
        {(latitude && longitude) && (
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
              Koordinat Lokasi
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  color: '#333',
                  backgroundColor: '#f5f5f5',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              >
                Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                {isDefaultLocation(latitude, longitude) && (
                  <span style={{ color: '#d32f2f', marginLeft: '8px' }}>
                    (Lokasi default - geser marker untuk mengubah)
                  </span>
                )}
              </Typography>
            </Box>
          </Box>
        )}

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
            Batal
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleConfirm}
            disabled={!isFormValid}
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
            Konfirmasi Lokasi & Wilayah
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
