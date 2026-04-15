import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function AddressMap({
  address,
  onLocationChange,
  latitude,
  longitude,
  additionalMarkers = [],
  primaryMarkerLabel = '',
  primaryMarkerTitle = '',
  mapTypeId = 'roadmap',
  mapTypeControl = true,
  zoomControl = true,
  fullscreenControl = true,
  hidePrimaryMarker = false,
  primaryMarkerColor = '#2e7d32',
  primaryMarkerScale = 7,
  primaryMarkerShape = 'circle',
  additionalMarkerScale = 7,
  additionalMarkerShape = 'circle',
  primaryMarkerDraggable = true,
  connectorPath = [],
  connectorLineColor = '#2f6fb2',
  radiusCircle = null,
  mapOptions = {},
  centerOverride = null,
  zoomOverride = null,
}) {
  const { isLoaded, loadError } = useGoogleMaps();
  const defaultCenter = { lat: -6.2088, lng: 106.8456 };
  const defaultZoom = 15;

  const initialLatitude = toFiniteNumber(latitude);
  const initialLongitude = toFiniteNumber(longitude);
  const initialCenter =
    initialLatitude !== null && initialLongitude !== null
      ? { lat: initialLatitude, lng: initialLongitude }
      : defaultCenter;

  const [markerPosition, setMarkerPosition] = useState(initialCenter);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMarkerDragEnd = useCallback(
    (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      const newPosition = { lat: newLat, lng: newLng };

      setMarkerPosition(newPosition);
      setMapCenter(newPosition);
      onLocationChange?.(newLat, newLng);
    },
    [onLocationChange]
  );

  const normalizedAdditionalMarkers = Array.isArray(additionalMarkers)
    ? additionalMarkers
        .map((marker, index) => {
          const markerLat = toFiniteNumber(marker?.latitude);
          const markerLng = toFiniteNumber(marker?.longitude);
          const markerScale = toFiniteNumber(marker?.scale);
          if (markerLat === null || markerLng === null) return null;

          return {
            key: String(marker?.id ?? `additional-marker-${index}`),
            position: { lat: markerLat, lng: markerLng },
            title: String(marker?.title || '').trim(),
            label: String(marker?.label || '').trim(),
            color: String(marker?.color || '').trim() || '#1f4e8c',
            scale: markerScale !== null && markerScale > 0 ? markerScale : additionalMarkerScale,
            shape: String(marker?.shape || '').trim() || additionalMarkerShape,
          };
        })
        .filter(Boolean)
    : [];

  const normalizedConnectorPath = Array.isArray(connectorPath)
    ? connectorPath
        .map((point) => {
          const pointLat = toFiniteNumber(point?.latitude ?? point?.lat);
          const pointLng = toFiniteNumber(point?.longitude ?? point?.lng);
          if (pointLat === null || pointLng === null) return null;
          return { lat: pointLat, lng: pointLng };
        })
        .filter(Boolean)
    : [];

  const normalizedRadiusCircle = (() => {
    const centerLat = toFiniteNumber(radiusCircle?.latitude ?? radiusCircle?.lat);
    const centerLng = toFiniteNumber(radiusCircle?.longitude ?? radiusCircle?.lng);
    const radius = toFiniteNumber(radiusCircle?.radiusMeters ?? radiusCircle?.radius);

    if (centerLat === null || centerLng === null || radius === null || radius <= 0) return null;

    return {
      center: { lat: centerLat, lng: centerLng },
      radius,
    };
  })();

  useEffect(() => {
    const nextLatitude = toFiniteNumber(latitude);
    const nextLongitude = toFiniteNumber(longitude);

    if (nextLatitude !== null && nextLongitude !== null) {
      const newPosition = { lat: nextLatitude, lng: nextLongitude };
      setMarkerPosition(newPosition);
      if (!centerOverride) {
        setMapCenter(newPosition);
      }
      setMapZoom(16);
    }
  }, [latitude, longitude, centerOverride]);

  useEffect(() => {
    const hasLatitude = toFiniteNumber(latitude) !== null;
    const hasLongitude = toFiniteNumber(longitude) !== null;
    if ((!address || !address.trim()) && !hasLatitude && !hasLongitude && !centerOverride) {
      setMarkerPosition(defaultCenter);
      setMapCenter(defaultCenter);
      setMapZoom(defaultZoom);
    }
  }, [address, latitude, longitude, centerOverride]);

  useEffect(() => {
    const overrideLat = toFiniteNumber(centerOverride?.latitude ?? centerOverride?.lat);
    const overrideLng = toFiniteNumber(centerOverride?.longitude ?? centerOverride?.lng);
    if (overrideLat === null || overrideLng === null) return;
    setMapCenter({ lat: overrideLat, lng: overrideLng });
  }, [centerOverride]);

  useEffect(() => {
    const overrideZoomNumber = toFiniteNumber(zoomOverride);
    if (overrideZoomNumber === null) return;
    setMapZoom(overrideZoomNumber);
  }, [zoomOverride]);

  const createMarkerLabel = useCallback((labelText, markerShape = 'circle') => {
    const normalizedText = String(labelText || '').trim();
    if (!normalizedText) return undefined;

    const normalizedShape = String(markerShape || '').toLowerCase();
    return {
      text: normalizedText.slice(0, 1),
      color: '#ffffff',
      fontWeight: '700',
      fontSize: normalizedShape === 'pin' ? '12px' : '11px',
    };
  }, []);

  const createMarkerIcon = useCallback((fillColor, markerScale = 7, markerShape = 'circle') => {
    if (!window.google?.maps?.SymbolPath) return undefined;
    const safeScale = toFiniteNumber(markerScale);

    if (String(markerShape || '').toLowerCase() === 'pin') {
      return {
        path: 'M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z',
        fillColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 1.8,
        scale: safeScale !== null && safeScale > 0 ? safeScale : 1,
        anchor: window.google?.maps?.Point ? new window.google.maps.Point(12, 24) : undefined,
        labelOrigin: window.google?.maps?.Point ? new window.google.maps.Point(12, 9) : undefined,
      };
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: safeScale !== null && safeScale > 0 ? safeScale : 7,
      labelOrigin: window.google?.maps?.Point ? new window.google.maps.Point(0, 0) : undefined,
    };
  }, []);

  if (!isLoaded) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div>Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#d32f2f' }}>
          <div>Failed to load Google Maps</div>
          <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>Please check your internet connection</div>
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
        disableDefaultUI: false,
        zoomControl,
        streetViewControl: false,
        mapTypeControl,
        fullscreenControl,
        mapTypeId,
        clickableIcons: false,
        ...mapOptions,
      }}
    >
      {normalizedRadiusCircle ? (
        <Circle
          center={normalizedRadiusCircle.center}
          radius={normalizedRadiusCircle.radius}
          options={{
            fillColor: '#1f4e8c',
            fillOpacity: 0.1,
            strokeColor: '#1f4e8c',
            strokeOpacity: 0.42,
            strokeWeight: 1.5,
            clickable: false,
            draggable: false,
            editable: false,
            zIndex: 1,
          }}
        />
      ) : null}

      {normalizedConnectorPath.length >= 2 ? (
        <Polyline
          path={normalizedConnectorPath}
          options={{
            strokeColor: connectorLineColor,
            strokeOpacity: 0.55,
            strokeWeight: 2,
            geodesic: true,
            clickable: false,
            zIndex: 2,
          }}
        />
      ) : null}

      {!hidePrimaryMarker ? (
        <Marker
          position={markerPosition}
          draggable={primaryMarkerDraggable}
          onDragEnd={onMarkerDragEnd}
          label={createMarkerLabel(primaryMarkerLabel, primaryMarkerShape)}
          title={String(primaryMarkerTitle || '').trim() || undefined}
          icon={createMarkerIcon(primaryMarkerColor, primaryMarkerScale, primaryMarkerShape)}
        />
      ) : null}

      {normalizedAdditionalMarkers.map((marker) => (
        <Marker
          key={marker.key}
          position={marker.position}
          title={marker.title || undefined}
          label={createMarkerLabel(marker.label, marker.shape)}
          draggable={false}
          icon={createMarkerIcon(marker.color, marker.scale, marker.shape)}
        />
      ))}
    </GoogleMap>
  );
}
