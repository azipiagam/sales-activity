import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import { getCoordinatesFromAddress } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapViewController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
}

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
  const mapRef = useRef(null);

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

    try {
      const coords = await getCoordinatesFromAddress(term);

      const newPosition = { lat: coords.lat, lng: coords.lng };

      setMarkerPosition(newPosition);
      
      setMapCenter(newPosition);
      setMapZoom(searchZoom);
      
      onLocationChange?.(coords.lat, coords.lng);
      
      setError(null);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError(
        err.message === 'Lokasi tidak ditemukan' 
          ? 'Lokasi tidak ditemukan. Silakan geser marker secara manual ke lokasi yang sesuai.'
          : 'Gagal mencari lokasi. Silakan coba lagi atau geser marker secara manual.'
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

  const handleMarkerDragEnd = (e) => {
    const position = e.target.getLatLng();
    const newPosition = { lat: position.lat, lng: position.lng };
    
    setMarkerPosition(newPosition);
    onLocationChange?.(position.lat, position.lng);
    
    setError(null);
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
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={{ height: 350, width: '100%' }}
          ref={mapRef}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Controller untuk mengupdate view peta */}
          <MapViewController center={mapCenter} zoom={mapZoom} />

          <Marker
            position={markerPosition}
            draggable
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>
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