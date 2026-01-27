import React, { useState, useEffect, createContext, useContext } from 'react';

// Context untuk status loading Google Maps
const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
});

// Custom hook untuk menggunakan Google Maps
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

// Provider untuk Google Maps
export default function GoogleMapsProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Cek apakah Google Maps sudah dimuat
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Cek apakah script sudah ada di DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script sudah ada, tunggu sampai loaded
      const checkIfLoaded = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
        } else {
          setTimeout(checkIfLoaded, 100);
        }
      };
      checkIfLoaded();
      return;
    }

    // Load Google Maps script
    const apiKey = "AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg";
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      setLoadError(error);
    };

    // Tambahkan script ke head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Jangan remove script karena bisa digunakan di tempat lain
      // Hanya cleanup jika diperlukan
    };
  }, []);

  const value = {
    isLoaded,
    loadError,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
