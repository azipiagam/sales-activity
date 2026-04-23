import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PopupValidationDone from '../PopupValidationDone';

export default function PopupDoneMasterCustomer({
  open,
  distanceKm,
  radiusLimitKm = 2,
  onConfirm,
  onCancel,
  disableBackdropClose = false,
}) {
  const hasDistance = Number.isFinite(distanceKm);
  const isOutsideRadius = hasDistance ? distanceKm > radiusLimitKm : false;
  const title = isOutsideRadius ? 'Di Luar Radius' : 'Dalam Radius';

  const message = useMemo(() => {
    if (!hasDistance) {
      return 'Koordinat master customer tidak tersedia, jarak tidak bisa dihitung.\n\nLanjutkan proses Done?';
    }

    const distanceText = distanceKm.toFixed(2);
    const withinRadiusDistanceText = Number(distanceText) === 0 ? '0' : distanceText;
    if (isOutsideRadius) {
      return (
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#b91c1c', mb: 0.75 }}>
            Diluar radius ({radiusLimitKm}km)
          </Typography>
          <Typography sx={{ color: '#374151', mb: 1 }}>
            Jarak dari lokasi customer:{' '}
            <Box component="span" sx={{ color: '#b91c1c', fontWeight: 700 }}>
              {distanceText} KM
            </Box>
          </Typography>
          <Typography sx={{ color: '#b91c1c', fontWeight: 600, mb: 1 }}>
            Anda bisa memilih simpan atau jangan simpan alamat utama di langkah berikutnya.
          </Typography>
          <Typography sx={{ color: '#1f2937', fontWeight: 700 }}>Lanjutkan proses?</Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography sx={{ fontWeight: 700, color: '#166534', mb: 0.75 }}>
          Dalam radius ({radiusLimitKm}km)
        </Typography>
        <Typography sx={{ color: '#374151', mb: 1 }}>
          Jarak dari lokasi customer:{' '}
          <Box component="span" sx={{ color: '#166534', fontWeight: 700 }}>
            {withinRadiusDistanceText} KM
          </Box>
        </Typography>
        <Typography sx={{ color: '#1f2937', fontWeight: 700 }}>Lanjutkan proses?</Typography>
      </Box>
    );
  }, [distanceKm, hasDistance, isOutsideRadius, radiusLimitKm]);

  return (
    <PopupValidationDone
      open={open}
      title={title}
      message={message}
      type={isOutsideRadius ? 'warning' : 'locationSuccess'}
      confirmText="Lanjutkan"
      cancelText="Batal"
      showCancel
      disableBackdropClose={disableBackdropClose}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
