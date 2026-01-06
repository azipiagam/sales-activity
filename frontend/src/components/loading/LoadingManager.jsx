import React from 'react';
import LoadingScreen from './LoadingScreen';
import LoadingMoveDate from './LoadingMoveDate';

/**
 * LoadingManager - Komponen pusat untuk mengatur loading screen berdasarkan tipe
 * 
 * @param {string} type - Tipe loading screen yang ingin ditampilkan
 *   - 'default' atau undefined: LoadingScreen standar (untuk initial load, fetch data, dll)
 *   - 'moveDate': LoadingMoveDate (untuk perubahan tanggal)
 *   - 'donePlan': LoadingDonePlan (untuk fitur done plan - bisa ditambahkan nanti)
 * 
 * @example
 * <LoadingManager type="moveDate" />
 * <LoadingManager type="default" />
 */
const LoadingManager = ({ type = 'default' }) => {
  switch (type) {
    case 'moveDate':
      return <LoadingMoveDate />;
    
    case 'default':
    default:
      return <LoadingScreen />;
  }
};

export default LoadingManager;

