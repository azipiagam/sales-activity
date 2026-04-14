import React, { useMemo } from 'react';
import PopupValidationDone from '../PopupValidationDone';

export default function PopupDoneAdditionalAddress({
  open,
  distanceKm,
  radiusLimitKm = 2,
  onConfirm,
  onCancel,
  disableBackdropClose = false,
}) {
  const hasDistance = Number.isFinite(distanceKm);
  const isOutsideRadius = hasDistance ? distanceKm > radiusLimitKm : false;
  const message = useMemo(() => {
    if (!hasDistance) {
      return 'Koordinat alamat tambahan tidak tersedia, jarak tidak bisa dihitung.\n\nLanjutkan proses Done?';
    }

    const distanceText = distanceKm.toFixed(2);
    if (isOutsideRadius) {
      return `Jarak hasil kunjungan ${distanceText} KM dari alamat tambahan customer (di luar radius ${radiusLimitKm} KM).\n\nLanjutkan proses Done?`;
    }

    return `Jarak hasil kunjungan ${distanceText} KM dari alamat tambahan customer (dalam radius ${radiusLimitKm} KM).\n\nLanjutkan proses Done?`;
  }, [distanceKm, hasDistance, isOutsideRadius, radiusLimitKm]);

  return (
    <PopupValidationDone
      open={open}
      title="Validasi Alamat Tambahan"
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
