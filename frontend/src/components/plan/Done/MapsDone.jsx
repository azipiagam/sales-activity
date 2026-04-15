import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { AddressMap } from '../maps';

const DISTANCE_LIMIT_KM = 2;

export default function MapsDone({
  currentLocation,
  customerLocation = null,
  customerAddress,
  resultAddress,
  distanceKm = null,
  locationLoading = false,
  saving = false,
  onGetCurrentLocation,
  onMapLocationChange,
}) {
  const customerMarker = customerLocation
    ? [
        {
          id: 'customer-location',
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          title: customerAddress?.trim() ? `Lokasi customer: ${customerAddress}` : 'Lokasi customer',
          label: 'C',
          color: '#1f4e8c',
        },
      ]
    : [];

  const hasCurrentLocation =
    Number.isFinite(Number(currentLocation?.latitude)) &&
    Number.isFinite(Number(currentLocation?.longitude));
  const hasCustomerLocation =
    Number.isFinite(Number(customerLocation?.latitude)) &&
    Number.isFinite(Number(customerLocation?.longitude));

  const centerOverride =
    hasCurrentLocation && hasCustomerLocation
      ? {
          latitude: (Number(currentLocation.latitude) + Number(customerLocation.latitude)) / 2,
          longitude: (Number(currentLocation.longitude) + Number(customerLocation.longitude)) / 2,
        }
      : hasCustomerLocation
      ? {
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
        }
      : null;

  const mapZoom = (() => {
    if (!Number.isFinite(distanceKm)) return hasCurrentLocation ? 15 : 13;
    if (distanceKm > 5) return 11;
    if (distanceKm > 2) return 12;
    if (distanceKm > 1) return 13;
    if (distanceKm > 0.4) return 14;
    return 15;
  })();

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        mt: 0,
        height: '100%',
        minHeight: { xs: 320, sm: 380, md: 430 },
        overflow: 'hidden',
        borderRadius: 0,
        borderBottom: '1px solid rgba(22, 58, 107, 0.14)',
        background: 'linear-gradient(145deg, rgba(31, 78, 140, 0.18), rgba(22, 58, 107, 0.24))',
      }}
    >
      <AddressMap
        address=""
        latitude={hasCurrentLocation ? currentLocation.latitude : customerLocation?.latitude}
        longitude={hasCurrentLocation ? currentLocation.longitude : customerLocation?.longitude}
        onLocationChange={onMapLocationChange}
        primaryMarkerLabel="U"
        primaryMarkerTitle={resultAddress?.trim() ? `Lokasi Anda: ${resultAddress}` : 'Lokasi Anda'}
        primaryMarkerColor="#29924f"
        primaryMarkerDraggable={hasCurrentLocation}
        hidePrimaryMarker={!hasCurrentLocation}
        additionalMarkers={customerMarker}
        radiusCircle={
          hasCustomerLocation
            ? {
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                radiusMeters: DISTANCE_LIMIT_KM * 1000,
              }
            : null
        }
        centerOverride={centerOverride}
        zoomOverride={mapZoom}
        mapTypeControl={false}
        fullscreenControl={false}
        mapOptions={{
          gestureHandling: 'greedy',
          minZoom: 4,
          maxZoom: 20,
        }}
      />

      {!hasCurrentLocation ? (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            width: 'calc(100% - 28px)',
            maxWidth: 320,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 1,
              color: '#15355f',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Ambil lokasi Anda untuk validasi radius kunjungan
          </Typography>
          <Button
            variant="contained"
            onClick={onGetCurrentLocation}
            disabled={locationLoading || saving}
            sx={{
              textTransform: 'none',
              borderRadius: 2.5,
              py: 1,
              fontWeight: 700,
              backgroundColor: '#163a6b',
              '&:hover': {
                backgroundColor: '#1f4e8c',
              },
            }}
          >
            {locationLoading ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Mengambil lokasi...
              </Box>
            ) : (
              'Ambil Lokasi Saat Ini'
            )}
          </Button>
        </Box>
      ) : null}

    </Box>
  );
}
