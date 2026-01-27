import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';


export default function AddressMap({ address, onLocationChange, latitude, longitude }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const defaultCenter = { lat: -6.2088, lng: 106.8456 };
  const defaultZoom = 15;

  // Use provided coordinates if available, otherwise use default
  const initialCenter = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;

  const [markerPosition, setMarkerPosition] = useState(initialCenter);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
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

  // Update position when coordinates change from props
  useEffect(() => {
    if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
      const newPosition = { lat: latitude, lng: longitude };
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      setMapZoom(17); // Zoom in when coordinates are set
    }
  }, [latitude, longitude]);

  // Reset to default position when address is empty and no coordinates provided
  useEffect(() => {
    if ((!address || !address.trim()) && (!latitude || !longitude)) {
      setMarkerPosition(defaultCenter);
      setMapCenter(defaultCenter);
      setMapZoom(defaultZoom);
    }
  }, [address, latitude, longitude]);



  // Show loading state while Google Maps is loading
  if (!isLoaded) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div>Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  // Show error state if loading failed
  if (loadError) {
    return (
      <div style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffebee',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', color: '#d32f2f' }}>
          <div>Failed to load Google Maps</div>
          <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
            Please check your internet connection
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ height: '100%', width: '100%' }}
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
  );
}