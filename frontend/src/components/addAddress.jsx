// React
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Material-UI Components
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

// Custom imports
import AddressMap from './AddressMap';

// Constants
const DEFAULT_COORDINATES = {
  LAT: -6.2088,
  LNG: 106.8456,
  TOLERANCE: 0.0001,
};

// Debounce delay in milliseconds
const SEARCH_DEBOUNCE_DELAY = 300;

// Cache untuk hasil pencarian
const searchCache = new Map();

export default function AddAddress({
  open,
  onClose,
  customerAddress = '',
  onLocationChange,
  onAddressConfirm
}) {
  // State untuk search dan lokasi
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(customerAddress);

  // Set initial address dari customer
  useEffect(() => {
    if (customerAddress && customerAddress.trim()) {
      setSelectedAddress(customerAddress.trim());
    }
  }, [customerAddress]);

  // Debouncing untuk search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-search ketika debounced query berubah
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      handleAutoSearch(debouncedQuery.trim());
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery]);

  const handleLocationChange = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  // Fungsi geocoding menggunakan Google Maps API
  const geocodeAddress = useCallback(async (address) => {
    const cacheKey = address.toLowerCase().trim();

    // Cek cache terlebih dahulu
    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey);
    }

    try {
      // Gunakan Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&region=id`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = {
          address: data.results[0].formatted_address,
          latitude: data.results[0].geometry.location.lat,
          longitude: data.results[0].geometry.location.lng,
          placeId: data.results[0].place_id
        };

        // Simpan ke cache
        searchCache.set(cacheKey, result);

        return result;
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }, []);

  // Auto search dengan debouncing
  const handleAutoSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setSearching(true);

      // Jika ada di cache, gunakan langsung
      const cacheKey = query.toLowerCase().trim();
      if (searchCache.has(cacheKey)) {
        const cachedResult = searchCache.get(cacheKey);
        setSearchResults([cachedResult]);
        setShowResults(true);
        return;
      }

      // Lakukan geocoding
      const result = await geocodeAddress(query);
      setSearchResults([result]);
      setShowResults(true);

    } catch (error) {
      console.error('Auto search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  }, [geocodeAddress]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    try {
      setSearching(true);
      const result = await geocodeAddress(searchQuery.trim());
      setSelectedAddress(result.address);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setSearchResults([]);
      setShowResults(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Manual search error:', error);
      // Fallback: set address tanpa geocoding
      setSelectedAddress(searchQuery.trim());
    } finally {
      setSearching(false);
    }
  }, [searchQuery, geocodeAddress]);

  const handleConfirm = useCallback(() => {
    // Validasi koordinat
    if (!latitude || !longitude) {
      return;
    }

    // Panggil callback dengan data lokasi dan alamat
    if (onLocationChange) {
      onLocationChange(latitude, longitude);
    }

    if (onAddressConfirm) {
      onAddressConfirm({
        address: selectedAddress,
        latitude,
        longitude,
      });
    }

    onClose();
  }, [latitude, longitude, selectedAddress, onLocationChange, onAddressConfirm, onClose]);

  const handleSelectResult = useCallback((result) => {
    setSelectedAddress(result.address);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setSearchQuery(result.address);
    setSearchResults([]);
    setShowResults(false);
  }, []);

  const handleClose = useCallback(() => {
    // Reset state saat close
    setSearchQuery('');
    setDebouncedQuery('');
    setSearching(false);
    setSearchResults([]);
    setShowResults(false);
    onClose();
  }, [onClose]);

  const isDefaultLocation = useCallback((lat, lng) => {
    return Math.abs(lat - DEFAULT_COORDINATES.LAT) < DEFAULT_COORDINATES.TOLERANCE &&
           Math.abs(lng - DEFAULT_COORDINATES.LNG) < DEFAULT_COORDINATES.TOLERANCE;
  }, []);
  
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
            Cari Lokasi
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
              Alamat Customer
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

        {/* Search Box */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
              color: '#666',
              mb: 1,
              fontWeight: 600,
            }}
          >
            Cari Lokasi Baru
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Masukkan alamat atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !searching) {
                  handleSearch();
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={() => {
                // Delay untuk allow click on results
                setTimeout(() => setShowResults(false), 200);
              }}
              InputProps={{
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} sx={{ color: '#6BA3D0' }} />
                  </InputAdornment>
                ) : null,
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

            {/* Dropdown Results */}
            {showResults && searchResults.length > 0 && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: '80px', // Leave space for search button
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflow: 'auto',
                  borderRadius: { xs: '8px', sm: '10px' },
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  mt: 0.5,
                }}
              >
                <List sx={{ py: 0 }}>
                  {searchResults.map((result, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSelectResult(result)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(107, 163, 208, 0.08)',
                        },
                        borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      <ListItemText
                        primary={result.address}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            color: '#333',
                            lineHeight: 1.4,
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching || !searchQuery || searchQuery.trim().length < 2}
              sx={{
                backgroundColor: '#6BA3D0',
                color: 'white',
                borderRadius: { xs: '8px', sm: '10px' },
                minWidth: '60px',
                '&:hover': {
                  backgroundColor: '#5a8fb8',
                },
                '&:disabled': {
                  backgroundColor: '#6BA3D0',
                  opacity: 0.6,
                },
              }}
            >
              {!searching && <SearchIcon />}
            </Button>
          </Box>
        </Box>

        {/* Selected Address Display */}
        {selectedAddress && (
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
              Alamat Terpilih
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
              }}
            >
              {selectedAddress}
            </Typography>
          </Box>
        )}

        {/* Map Component */}
        <AddressMap
          address={selectedAddress || customerAddress}
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
            disabled={!latitude || !longitude || isDefaultLocation(latitude, longitude)}
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
            Konfirmasi Lokasi
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
