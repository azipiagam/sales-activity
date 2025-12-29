import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import GoogleMapReact from 'google-map-react';
import { getCoordinatesFromAddress as geocodeAddress } from '../utils/geocoding';

const MarkerComponent = ({ lat, lng }) => (
  <div
    style={{
      position: 'absolute',
      transform: 'translate(-50%, -100%)',
      cursor: 'pointer',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50% 50% 50% 0',
        background: '#6BA3D0',
        transform: 'rotate(-45deg)',
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'white',
      }}
    />
  </div>
); 

export default function AddressMap({ address }) {
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);
  
  const GOOGLE_MAPS_API_KEY = useMemo(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', []);

  const getGoogleMapsEmbedUrl = useCallback((address) => {
    if (!address || !address.trim()) return '';
    const encodedAddress = encodeURIComponent(address);
    
    if (GOOGLE_MAPS_API_KEY) {
      return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}&zoom=15`;
    }
    
    return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    const performGeocoding = async () => {
      if (!address || !address.trim()) {
        setMapCoordinates(null);
        setGeocodingError(null);
        return;
      }

      setGeocodingAddress(true);
      setGeocodingError(null);
      try {
        const coords = await geocodeAddress(address, GOOGLE_MAPS_API_KEY);
        if (coords) {
          setMapCoordinates(coords);
          setGeocodingError(null);
          console.log('✅ Geocoding berhasil:', coords);
        } else {
          setMapCoordinates(null);
          setGeocodingError('Koordinat tidak ditemukan, tetapi peta tetap ditampilkan. Alamat mungkin perlu lebih spesifik.');
          console.warn('⚠️ Geocoding gagal untuk alamat:', address);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        setMapCoordinates(null);
        setGeocodingError(`Koordinat tidak ditemukan, tetapi peta tetap ditampilkan. Error: ${error.message || 'Gagal mendapatkan koordinat'}`);
      } finally {
        setGeocodingAddress(false);
      }
    };

    // Debounce geocoding
    const timeoutId = setTimeout(() => {
      performGeocoding();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [address, GOOGLE_MAPS_API_KEY]);

  if (!address || !address.trim()) {
    return null;
  }

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
        Lokasi Peta
      </Typography>
      {geocodingAddress ? (
        <Box
          sx={{
            height: { xs: '250px', sm: '300px', md: '350px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: { xs: '8px', sm: '10px' },
            border: '1px solid rgba(0, 0, 0, 0.23)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <CircularProgress size={40} sx={{ color: '#6BA3D0' }} />
          <Typography variant="body2" sx={{ ml: 2, color: '#666' }}>
            Mencari lokasi...
          </Typography>
        </Box>
      ) : mapCoordinates ? (
        <Box
          sx={{
            height: { xs: '250px', sm: '300px', md: '350px' },
            width: '100%',
            borderRadius: { xs: '8px', sm: '10px' },
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.23)',
          }}
        >
          {GOOGLE_MAPS_API_KEY ? (
            // Gunakan GoogleMapReact jika ada API key
            <GoogleMapReact
              bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
              defaultCenter={{
                lat: mapCoordinates.latitude,
                lng: mapCoordinates.longitude,
              }}
              center={{
                lat: mapCoordinates.latitude,
                lng: mapCoordinates.longitude,
              }}
              defaultZoom={15}
            >
              <MarkerComponent
                lat={mapCoordinates.latitude}
                lng={mapCoordinates.longitude}
              />
            </GoogleMapReact>
          ) : (
            // Fallback ke Google Maps Embed (iframe) jika tidak ada API key
            <iframe
              width="100%"
              height="100%"
              style={{
                border: 0,
                borderRadius: '8px',
              }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={getGoogleMapsEmbedUrl(address)}
              title="Google Maps"
            />
          )}
        </Box>
      ) : (
        // Jika geocoding gagal, tetap tampilkan Google Maps Embed dengan alamat
        <Box
          sx={{
            height: { xs: '250px', sm: '300px', md: '350px' },
            width: '100%',
            borderRadius: { xs: '8px', sm: '10px' },
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.23)',
          }}
        >
          <iframe
            width="100%"
            height="100%"
            style={{
              border: 0,
              borderRadius: '8px',
            }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={getGoogleMapsEmbedUrl(address)}
            title="Google Maps"
          />
        </Box>
      )}
    </Box>
  );
}

