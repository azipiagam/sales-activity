import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { getCoordinatesFromAddress } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';

// Fix untuk default marker icon di react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Komponen untuk update map center saat koordinat berubah
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function AddressMap({ address, onLocationChange }) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Ref untuk track apakah user sudah menggeser marker secara manual
  const userDraggedMarker = useRef(false);
  const lastAddressRef = useRef('');

  // Default center ke Indonesia
  const defaultCenter = useMemo(() => ({ lat: -6.2088, lng: 106.8456 }), []);

  // Helper function untuk check apakah koordinat adalah default center
  const isDefaultCenter = useCallback((lat, lng) => {
    return lat === defaultCenter.lat && lng === defaultCenter.lng;
  }, [defaultCenter]);

  // Tampilkan peta langsung dengan default center saat alamat pertama kali diisi
  useEffect(() => {
    if (address && address.trim()) {
      // Set marker di default center untuk display (jika belum ada marker)
      if (!markerPosition) {
        setMarkerPosition(defaultCenter);
        setIsManualLocation(true);
      }
      
      // Pastikan map ready
      if (!mapReady) {
        setMapReady(true);
      }
    }
  }, [address, defaultCenter, markerPosition, mapReady]);

  // Geocoding otomatis saat alamat berubah
  useEffect(() => {
    const performGeocoding = async () => {
      // Validasi alamat kosong
      if (!address || typeof address !== 'string' || !address.trim()) {
        setCoordinates(null);
        setMarkerPosition(null);
        setError(null);
        setWarning(null);
        setIsManualLocation(false);
        setMapReady(false);
        userDraggedMarker.current = false;
        lastAddressRef.current = '';
        if (onLocationChange) {
          onLocationChange(null, null);
        }
        return;
      }

      const trimmedAddress = address.trim();
      
      // Validasi panjang alamat minimum (minimal 5 karakter)
      if (trimmedAddress.length < 5) {
        console.log('[AddressMap] Address too short, skipping geocoding');
        // Tetap tampilkan map dengan default center
        if (!markerPosition) {
          setMarkerPosition(defaultCenter);
          setIsManualLocation(true);
        }
        setError(null);
        setWarning('Alamat terlalu pendek. Silakan lengkapi alamat atau geser marker pada peta.');
        lastAddressRef.current = trimmedAddress;
        return;
      }

      // Skip jika alamat sama dengan sebelumnya (untuk menghindari geocoding berulang)
      if (trimmedAddress === lastAddressRef.current) {
        return;
      }

      // Reset flag saat alamat berubah
      const addressChanged = trimmedAddress !== lastAddressRef.current;
      if (addressChanged) {
        userDraggedMarker.current = false;
        setCoordinates(null);
      }

      // Tampilkan peta langsung tanpa menunggu geocoding
      if (!mapReady) {
        setMapReady(true);
      }

      // Set marker di default center untuk display saat geocoding dimulai
      if (!markerPosition) {
        setMarkerPosition(defaultCenter);
        setIsManualLocation(true);
      }

      setLoading(true);
      setError(null);
      setWarning(null);
      
      try {
        console.log('[AddressMap] Starting geocoding for:', trimmedAddress);
        const coords = await getCoordinatesFromAddress(trimmedAddress);
        
        if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' 
            && !isNaN(coords.lat) && !isNaN(coords.lng)) {
          const newCoords = { lat: coords.lat, lng: coords.lng };
          setCoordinates(newCoords);
          
          // Hanya update marker jika user belum menggeser marker secara manual
          if (!userDraggedMarker.current) {
            setMarkerPosition(newCoords);
            setIsManualLocation(false);
            setWarning(null);
            setError(null);
            // SELALU kirim koordinat yang valid dari geocoding
            if (onLocationChange) {
              onLocationChange(coords.lat, coords.lng);
            }
            console.log('[AddressMap] ✅ Geocoding success, coordinates:', newCoords);
          } else {
            // Jika sudah manual, tetap update coordinates tapi jangan ubah marker
            setWarning('📍 Lokasi saat ini diatur manual. Geocoding menemukan lokasi alternatif. Geser marker jika ingin menggunakan lokasi dari geocoding.');
            // Jangan kirim koordinat baru karena user sudah set manual
          }
          lastAddressRef.current = trimmedAddress;
        } else {
          // Jika geocoding gagal, pastikan marker tetap ada untuk display
          if (!markerPosition) {
            setMarkerPosition(defaultCenter);
            setIsManualLocation(true);
          }
          setCoordinates(null);
          if (onLocationChange) {
            onLocationChange(null, null);
          }
          setError('⚠️ Alamat tidak ditemukan. Silakan geser marker pada peta untuk menentukan lokasi secara manual.');
          console.warn('[AddressMap] ⚠️ Geocoding returned null for address:', trimmedAddress);
          lastAddressRef.current = trimmedAddress;
        }
      } catch (err) {
        console.error('[AddressMap] ❌ Error geocoding address:', err);
        
        // Handle berbagai jenis error
        let errorMessage = '⚠️ Gagal mendapatkan koordinat untuk alamat ini.';
        
        if (err instanceof TypeError && err.message.includes('fetch')) {
          errorMessage = '⚠️ Gagal terhubung ke server geocoding. Pastikan koneksi internet aktif. Silakan geser marker pada peta untuk menentukan lokasi secara manual.';
        } else if (err.message) {
          errorMessage = `⚠️ ${err.message}. Silakan geser marker pada peta untuk menentukan lokasi secara manual.`;
        } else {
          errorMessage = '⚠️ Terjadi kesalahan saat mencari koordinat. Silakan geser marker pada peta untuk menentukan lokasi secara manual.';
        }
        
        // Pastikan marker tetap ada untuk display
        if (!markerPosition) {
          setMarkerPosition(defaultCenter);
          setIsManualLocation(true);
        }
        setCoordinates(null);
        if (onLocationChange) {
          onLocationChange(null, null);
        }
        setError(errorMessage);
        lastAddressRef.current = trimmedAddress;
      } finally {
        setLoading(false);
      }
    };

    // Debounce: 500ms untuk menghindari request berulang saat user sedang mengetik
    const timeoutId = setTimeout(() => {
      performGeocoding();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [address, onLocationChange, defaultCenter, mapReady, markerPosition]);

  // Handler saat marker digeser
  const handleMarkerDragEnd = useCallback((e) => {
    const newPosition = e.target.getLatLng();
    const newCoords = {
      lat: newPosition.lat,
      lng: newPosition.lng,
    };
    setMarkerPosition(newCoords);
    setCoordinates(newCoords);
    setIsManualLocation(true);
    userDraggedMarker.current = true; // Mark bahwa user sudah menggeser marker
    setError(null); // Clear error karena user sudah menentukan lokasi manual
    
    // Cek apakah masih di default center
    if (isDefaultCenter(newCoords.lat, newCoords.lng)) {
      setWarning('⚠️ Lokasi masih di default center. Pastikan untuk menggeser marker ke lokasi yang sesuai dengan alamat.');
      // JANGAN kirim koordinat default ke parent
      if (onLocationChange) {
        onLocationChange(null, null);
      }
    } else {
      setWarning('📍 Lokasi telah diatur secara manual. Pastikan lokasi sesuai dengan alamat yang dimasukkan.');
      // Kirim koordinat yang valid
      if (onLocationChange) {
        onLocationChange(newCoords.lat, newCoords.lng);
      }
    }
    console.log('📍 Marker digeser ke:', newCoords);
  }, [onLocationChange, isDefaultCenter]);

  // Jika tidak ada alamat, jangan render apa-apa
  if (!address || !address.trim()) {
    return null;
  }

  // Map center dan zoom
  const mapCenter = markerPosition || coordinates || defaultCenter;
  const zoom = markerPosition || coordinates ? 15 : 5;

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
      
      {/* Loading indicator hanya muncul saat geocoding, tapi peta tetap ditampilkan */}
      {loading && (
        <Alert severity="info" sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} sx={{ color: '#6BA3D0', mr: 1 }} />
            <Typography variant="body2" sx={{ color: '#666' }}>
              Mencari lokasi berdasarkan alamat...
            </Typography>
          </Box>
        </Alert>
      )}

      {error && !loading && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {warning && !loading && !error && (
        <Alert severity="info" sx={{ mb: 1 }}>
          {warning}
        </Alert>
      )}

      {/* Tampilkan peta langsung, tidak perlu menunggu geocoding selesai */}
      {mapReady && (
        <Box
          sx={{
            height: { xs: '250px', sm: '300px', md: '350px' },
            width: '100%',
            borderRadius: { xs: '8px', sm: '10px' },
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            '& .leaflet-container': {
              height: '100%',
              width: '100%',
              borderRadius: { xs: '8px', sm: '10px' },
            },
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            whenReady={() => setMapReady(true)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <MapUpdater center={mapCenter} zoom={zoom} />
            {/* Marker selalu muncul dan draggable */}
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                }}
              />
            )}
          </MapContainer>
        </Box>
      )}

      {markerPosition && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#666',
              fontSize: '0.75rem',
              mb: 0.5,
            }}
          >
            <strong>Koordinat:</strong> {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: isManualLocation ? '#ff9800' : '#4caf50',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {isManualLocation 
              ? '📍 Lokasi diatur secara manual' 
              : '✅ Koordinat sesuai dengan alamat'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#999',
              fontSize: '0.7rem',
              mt: 0.5,
            }}
          >
            Geser marker pada peta untuk mengubah lokasi
          </Typography>
        </Box>
      )}
    </Box>
  );
}
