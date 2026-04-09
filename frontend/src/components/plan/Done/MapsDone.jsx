import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { AddressMap } from '../maps';

export default function MapsDone({
  currentLocation,
  locationLoading = false,
  saving = false,
  onGetCurrentLocation,
  onMapLocationChange,
}) {
  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        mt: 0,
        height: {
          xs: 'calc(100dvh - 206px)',
          sm: 'calc(100dvh - 230px)',
          md: 'calc(100dvh - 248px)',
        },
        minHeight: { xs: 320, sm: 380, md: 430 },
        overflow: 'hidden',
        borderBottom: '1px solid rgba(22, 58, 107, 0.14)',
        background:
          'linear-gradient(145deg, rgba(31, 78, 140, 0.18), rgba(22, 58, 107, 0.24))',
      }}
    >
      {currentLocation ? (
        <AddressMap
          address=""
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
          onLocationChange={onMapLocationChange}
        />
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={onGetCurrentLocation}
            disabled={locationLoading || saving}
            sx={{
              textTransform: 'none',
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
      )}

      {currentLocation ? (
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 10, sm: 16 },
            bottom: { xs: 10, sm: 16 },
            px: 1.25,
            py: 0.75,
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 6px 18px rgba(12, 26, 49, 0.2)',
            maxWidth: 'calc(100% - 20px)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: '#1d3557',
              fontWeight: 600,
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}
          >
            Koordinat: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            {currentLocation.accuracy
              ? ` (akurasi +/-${Math.round(currentLocation.accuracy)} m)`
              : ''}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
