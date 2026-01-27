import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';


export default function AddressMap({ address, onLocationChange, latitude, longitude }) {
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



  return (
    <LoadScript googleMapsApiKey="AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg">
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
    </LoadScript>
  );
}