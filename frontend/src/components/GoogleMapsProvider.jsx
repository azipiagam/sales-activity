import React, { useState, useEffect, createContext, useContext } from 'react';

// Context untuk status loading Google Maps
const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
});

const GOOGLE_MAPS_CALLBACK = '__salesActivityGoogleMapsInit';

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
    let isActive = true;
    let checkIfLoadedTimer = null;

    const markLoaded = () => {
      if (isActive) {
        setIsLoaded(true);
      }
    };

    // Cek apakah Google Maps sudah dimuat
    if (window.google && window.google.maps) {
      markLoaded();
      return undefined;
    }

    // Cek apakah script sudah ada di DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script sudah ada, tunggu sampai loaded
      const checkIfLoaded = () => {
        if (window.google && window.google.maps) {
          markLoaded();
        } else if (isActive) {
          checkIfLoadedTimer = window.setTimeout(checkIfLoaded, 100);
        }
      };
      checkIfLoaded();
      return () => {
        isActive = false;
        if (checkIfLoadedTimer) {
          window.clearTimeout(checkIfLoadedTimer);
        }
      };
    }

    // Load Google Maps script
    const apiKey = "AIzaSyCOtWjb76olbxd98XsfqhdnDpv-BTi7wxg";
    const previousCallback = window[GOOGLE_MAPS_CALLBACK];
    const handleCallback = () => {
      if (typeof previousCallback === 'function') {
        previousCallback();
      }
      markLoaded();
    };

    window[GOOGLE_MAPS_CALLBACK] = handleCallback;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${GOOGLE_MAPS_CALLBACK}`;
    script.async = true;
    script.defer = true;

    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      if (isActive) {
        setLoadError(error);
      }
    };

    // Tambahkan script ke head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      isActive = false;
      if (window[GOOGLE_MAPS_CALLBACK] === handleCallback) {
        if (typeof previousCallback === 'function') {
          window[GOOGLE_MAPS_CALLBACK] = previousCallback;
        } else {
          delete window[GOOGLE_MAPS_CALLBACK];
        }
      }
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
