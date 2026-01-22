import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import { getCoordinatesFromAddressEnhanced, analyzeAddressForGeocoding } from '../utils/geocoding';


export default function AddressMap({ address, onLocationChange }) {
  const defaultCenter = { lat: -6.2088, lng: 106.8456 };
  const defaultZoom = 15;
  const searchZoom = 17;

  const [search, setSearch] = useState('');
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingTips, setGeocodingTips] = useState(null);
  const [lastSuccessfulAddress, setLastSuccessfulAddress] = useState(null);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMarkerDragEnd = useCallback((event) => {
    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    const newPosition = { lat: newLat, lng: newLng };

    setMarkerPosition(newPosition);
    setMapCenter(newPosition);
    onLocationChange?.(newLat, newLng);
  }, [onLocationChange]);

  useEffect(() => {
    if (address && address.trim() && address !== search) {
      setSearch(address);
    }
  }, [address]);

  useEffect(() => {
    if (address && address.trim()) {
      handleSearchAddress(address);
    }
  }, [address]);

  const handleSearchAddress = async (searchTerm) => {
    const term = searchTerm || search;
    if (!term.trim()) return;

    setIsSearching(true);
    setError(null);
    setGeocodingTips(null);
    setLastSuccessfulAddress(null);

    try {
      const result = await getCoordinatesFromAddressEnhanced(term);
      const coords = { lat: result.lat, lng: result.lng };

      const newPosition = { lat: coords.lat, lng: coords.lng };

      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      setMapZoom(searchZoom);

      onLocationChange?.(coords.lat, coords.lng);

      // Show success message with confidence info
      if (result.confidence === 'approximate') {
        setGeocodingTips({
          type: 'info',
          message: `Lokasi ditemukan dengan perkiraan. Menggunakan alamat: "${result.address}"`,
          suggestions: ['Geser marker jika lokasi tidak tepat']
        });
      } else if (result.confidence === 'good') {
        setGeocodingTips({
          type: 'success',
          message: `Lokasi ditemukan dengan akurasi baik. Menggunakan: "${result.address}"`
        });
      }

      setLastSuccessfulAddress(result.address);
      setError(null);

    } catch (err) {
      console.error('Geocoding error:', err);

      // Analyze the address for tips
      const analysis = analyzeAddressForGeocoding(term);

      if (analysis.hasIssues) {
        setGeocodingTips({
          type: 'warning',
          message: 'Alamat sulit dicari. Berikut beberapa masalah dan saran:',
          issues: analysis.issues,
          suggestions: analysis.suggestions
        });
      }

      setError(
        err.message.includes('sulit dicari')
          ? err.message
          : 'Lokasi tidak ditemukan. Silakan geser marker secara manual ke lokasi yang sesuai.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    handleSearchAddress();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };


  return (
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
        Cari Lokasi Customer
      </Typography>

      {/* Search Input */}
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        placeholder="Ketik alamat lengkap untuk mencari lokasi... (contoh: Jl. Sudirman No. 1, Jakarta Pusat)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKeyPress}
        disabled={isSearching}
        sx={{
          mb: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: { xs: '8px', sm: '10px' },
            paddingRight: '50px',
            '&:hover fieldset': {
              borderColor: '#6BA3D0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6BA3D0',
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <IconButton 
              onClick={handleSearch} 
              disabled={!search.trim() || isSearching}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: '#6BA3D0',
                '&:hover': {
                  backgroundColor: 'rgba(107, 163, 208, 0.08)',
                },
              }}
            >
              {isSearching ? (
                <CircularProgress size={20} sx={{ color: '#6BA3D0' }} />
              ) : (
                <SearchIcon />
              )}
            </IconButton>
          ),
        }}
      />

      {/* Error display */}
      {error && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: '#d32f2f',
            fontSize: '0.875rem',
            padding: '8px 12px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
          }}
        >
          {error}
        </Typography>
      )}

      {/* Geocoding Tips */}
      {geocodingTips && (
        <Box sx={{ mb: 1.5 }}>
          {geocodingTips.type === 'warning' && geocodingTips.issues && (
            <Box sx={{
              padding: '12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              mb: 1
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#856404', mb: 1 }}>
                ⚠️ {geocodingTips.message}
              </Typography>

              {geocodingTips.issues.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#856404' }}>
                    Masalah:
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {geocodingTips.issues.map((issue, index) => (
                      <li key={index} style={{ fontSize: '0.75rem', color: '#856404' }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </Box>
              )}

              {geocodingTips.suggestions.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#856404' }}>
                    Saran:
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {geocodingTips.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ fontSize: '0.75rem', color: '#856404' }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          )}

          {geocodingTips.type === 'info' && (
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                color: '#0d6efd',
                fontSize: '0.875rem',
                padding: '8px 12px',
                backgroundColor: '#e7f3ff',
                borderRadius: '4px',
              }}
            >
              ℹ️ {geocodingTips.message}
              {geocodingTips.suggestions && geocodingTips.suggestions.map((suggestion, index) => (
                <div key={index} style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  • {suggestion}
                </div>
              ))}
            </Typography>
          )}

          {geocodingTips.type === 'success' && (
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                color: '#198754',
                fontSize: '0.875rem',
                padding: '8px 12px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px',
              }}
            >
              ✅ {geocodingTips.message}
            </Typography>
          )}
        </Box>
      )}

      {/* Info text */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          mb: 1.5,
          color: '#666',
          fontSize: '0.8rem',
        }}
      >
        💡 Tip: Marker dapat digeser secara manual untuk penyesuaian lokasi yang lebih akurat
      </Typography>

      {/* Map Container */}
      <Box
        sx={{
          borderRadius: { xs: '8px', sm: '10px' },
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          mb: 1,
        }}
      >
        <LoadScript googleMapsApiKey="AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg">
          <GoogleMap
            mapContainerStyle={{ height: 350, width: '100%' }}
            center={mapCenter}
            zoom={mapZoom}
            onLoad={onMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
        </LoadScript>
      </Box>

      {/* Coordinates display */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#666',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
        }}
      >
        📍 Koordinat: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
      </Typography>
    </Box>
  );
}