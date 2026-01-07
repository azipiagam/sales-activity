import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Material-UI Components
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid
} from '@mui/material';

// Material-UI Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import MapIcon from '@mui/icons-material/Map';

// Custom data
import {
  getProvinces,
  getRegenciesByProvince,
  getDistrictsByRegency
} from '../data/indonesiaRegions';

// Constants
const INPUT_LABELS = {
  PROVINCE: 'Provinsi',
  REGENCY: 'Kota/Kabupaten',
  DISTRICT: 'Kecamatan (Opsional)'
};

const PLACEHOLDERS = {
  PROVINCE: 'Pilih Provinsi',
  REGENCY: 'Pilih Kota/Kabupaten',
  DISTRICT: 'Pilih Kecamatan'
};

const NO_OPTIONS_TEXT = {
  PROVINCE: 'Provinsi tidak ditemukan',
  REGENCY: 'Pilih provinsi terlebih dahulu',
  DISTRICT: 'Pilih kota/kabupaten terlebih dahulu'
};

// Custom Paper component for Autocomplete
const CustomPaper = ({ children, ...props }) => (
  <Paper
    elevation={3}
    sx={{
      mt: 1,
      borderRadius: 2,
      '& .MuiAutocomplete-listbox': {
        '& .MuiAutocomplete-option': {
          py: 1.5,
          px: 2,
          '&:hover': {
            backgroundColor: 'rgba(107, 163, 208, 0.08)',
          },
          '&[aria-selected="true"]': {
            backgroundColor: 'rgba(107, 163, 208, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(107, 163, 208, 0.16)',
            },
          },
        },
      },
    }}
    {...props}
  >
    {children}
  </Paper>
);

// Helper function untuk filter options berdasarkan input
const filterOptions = (options, inputValue) => {
  if (!inputValue) return options;

  const searchValue = inputValue.toLowerCase();
  return options.filter(option =>
    option.name.toLowerCase().includes(searchValue)
  );
};

// Main component
const RegionSelector = ({
  value = {},
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  showDistrict = true,
  sx = {}
}) => {
  // State management
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedRegency, setSelectedRegency] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Input values untuk search
  const [provinceInputValue, setProvinceInputValue] = useState('');
  const [regencyInputValue, setRegencyInputValue] = useState('');
  const [districtInputValue, setDistrictInputValue] = useState('');

  // Data options
  const provinces = useMemo(() => getProvinces(), []);
  const regencies = useMemo(() =>
    selectedProvince ? getRegenciesByProvince(selectedProvince.id) : [],
    [selectedProvince]
  );
  const districts = useMemo(() =>
    selectedRegency && showDistrict ? getDistrictsByRegency(selectedRegency.id) : [],
    [selectedRegency, showDistrict]
  );

  // Filtered options berdasarkan input
  const filteredProvinces = useMemo(() =>
    filterOptions(provinces, provinceInputValue),
    [provinces, provinceInputValue]
  );

  const filteredRegencies = useMemo(() =>
    filterOptions(regencies, regencyInputValue),
    [regencies, regencyInputValue]
  );

  const filteredDistricts = useMemo(() =>
    filterOptions(districts, districtInputValue),
    [districts, districtInputValue]
  );

  // Initialize from props
  useEffect(() => {
    if (value.province) {
      const province = provinces.find(p => p.id === value.province.id);
      setSelectedProvince(province || null);
      setProvinceInputValue(province?.name || '');
    }
    if (value.regency) {
      setSelectedRegency(value.regency);
      setRegencyInputValue(value.regency.name || '');
    }
    if (value.district && showDistrict) {
      setSelectedDistrict(value.district);
      setDistrictInputValue(value.district.name || '');
    }
  }, [value, provinces, showDistrict]);

  // Handle province change
  const handleProvinceChange = useCallback((event, newValue) => {
    setSelectedProvince(newValue);
    setProvinceInputValue(newValue?.name || '');

    // Reset regency dan district
    setSelectedRegency(null);
    setRegencyInputValue('');
    setSelectedDistrict(null);
    setDistrictInputValue('');

    // Call onChange
    if (onChange) {
      onChange({
        province: newValue,
        regency: null,
        district: null
      });
    }
  }, [onChange]);

  // Handle regency change
  const handleRegencyChange = useCallback((event, newValue) => {
    setSelectedRegency(newValue);
    setRegencyInputValue(newValue?.name || '');

    // Reset district
    setSelectedDistrict(null);
    setDistrictInputValue('');

    // Call onChange
    if (onChange) {
      onChange({
        province: selectedProvince,
        regency: newValue,
        district: null
      });
    }
  }, [selectedProvince, onChange]);

  // Handle district change
  const handleDistrictChange = useCallback((event, newValue) => {
    setSelectedDistrict(newValue);
    setDistrictInputValue(newValue?.name || '');

    // Call onChange
    if (onChange) {
      onChange({
        province: selectedProvince,
        regency: selectedRegency,
        district: newValue
      });
    }
  }, [selectedProvince, selectedRegency, onChange]);

  // Handle input changes untuk search
  const handleProvinceInputChange = useCallback((event, newInputValue, reason) => {
    if (reason === 'input') {
      setProvinceInputValue(newInputValue);
    }
  }, []);

  const handleRegencyInputChange = useCallback((event, newInputValue, reason) => {
    if (reason === 'input') {
      setRegencyInputValue(newInputValue);
    }
  }, []);

  const handleDistrictInputChange = useCallback((event, newInputValue, reason) => {
    if (reason === 'input') {
      setDistrictInputValue(newInputValue);
    }
  }, []);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Pilih Wilayah
          {required && <span style={{ color: 'red' }}> *</span>}
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <FormHelperText error sx={{ mb: 2 }}>
          {helperText}
        </FormHelperText>
      )}

      {/* Region Inputs */}
      <Grid container spacing={2}>
        {/* Province Input */}
        <Grid item xs={12} sm={showDistrict ? 4 : 6}>
          <FormControl fullWidth error={error} required={required}>
            <Autocomplete
              id="province-select"
              options={filteredProvinces}
              value={selectedProvince}
              inputValue={provinceInputValue}
              onChange={handleProvinceChange}
              onInputChange={handleProvinceInputChange}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              PaperComponent={CustomPaper}
              disabled={disabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={INPUT_LABELS.PROVINCE}
                  placeholder={PLACEHOLDERS.PROVINCE}
                  required={required}
                  error={error}
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
              )}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <BusinessIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                </Box>
              )}
              noOptionsText={
                provinceInputValue
                  ? "Provinsi tidak ditemukan"
                  : "Ketik untuk mencari provinsi..."
              }
            />
          </FormControl>
        </Grid>

        {/* Regency Input */}
        <Grid item xs={12} sm={showDistrict ? 4 : 6}>
          <FormControl fullWidth error={error} required={required}>
            <Autocomplete
              id="regency-select"
              options={filteredRegencies}
              value={selectedRegency}
              inputValue={regencyInputValue}
              onChange={handleRegencyChange}
              onInputChange={handleRegencyInputChange}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              PaperComponent={CustomPaper}
              disabled={disabled || !selectedProvince}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={INPUT_LABELS.REGENCY}
                  placeholder={
                    selectedProvince
                      ? PLACEHOLDERS.REGENCY
                      : "Pilih provinsi terlebih dahulu"
                  }
                  required={required}
                  error={error}
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
              )}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <MapIcon sx={{ mr: 1.5, color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                </Box>
              )}
              noOptionsText={
                !selectedProvince
                  ? NO_OPTIONS_TEXT.REGENCY
                  : regencyInputValue
                    ? "Kota/Kabupaten tidak ditemukan"
                    : "Ketik untuk mencari kota/kabupaten..."
              }
            />
          </FormControl>
        </Grid>

        {/* District Input (Optional) */}
        {showDistrict && (
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <Autocomplete
                id="district-select"
                options={filteredDistricts}
                value={selectedDistrict}
                inputValue={districtInputValue}
                onChange={handleDistrictChange}
                onInputChange={handleDistrictInputChange}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                PaperComponent={CustomPaper}
                disabled={disabled || !selectedRegency}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={INPUT_LABELS.DISTRICT}
                    placeholder={
                      selectedRegency
                        ? PLACEHOLDERS.DISTRICT
                        : "Pilih kota/kabupaten terlebih dahulu"
                    }
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
                )}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    <LocationOnIcon sx={{ mr: 1.5, color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                  </Box>
                )}
                noOptionsText={
                  !selectedRegency
                    ? NO_OPTIONS_TEXT.DISTRICT
                    : districtInputValue
                      ? "Kecamatan tidak ditemukan"
                      : "Ketik untuk mencari kecamatan..."
                }
              />
            </FormControl>
          </Grid>
        )}
      </Grid>

      {/* Selected Region Summary */}
      {(selectedProvince || selectedRegency || selectedDistrict) && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Wilayah Terpilih:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedProvince && (
              <Chip
                icon={<BusinessIcon />}
                label={`Provinsi: ${selectedProvince.name}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedRegency && (
              <Chip
                icon={<MapIcon />}
                label={`Kota/Kab: ${selectedRegency.name}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {selectedDistrict && (
              <Chip
                icon={<LocationOnIcon />}
                label={`Kecamatan: ${selectedDistrict.name}`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RegionSelector;
