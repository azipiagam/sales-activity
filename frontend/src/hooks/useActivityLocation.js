// hooks/useActivityLocation.js
// Custom hook untuk handle location validation dan submission

import { useState } from 'react';
import { checkLocationDistance, markActivityAsDone } from '../utils/activityLocationApi';

/**
 * Hook untuk manage activity location validation dan submission
 * 
 * Usage:
 * const {
 *   isCheckingDistance,
 *   isSubmitting,
 *   distanceData,
 *   error,
 *   validateLocation,
 *   submitActivityDone,
 *   resetState
 * } = useActivityLocation(token);
 */
export const useActivityLocation = (token) => {
  const [isCheckingDistance, setIsCheckingDistance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distanceData, setDistanceData] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Validate location dan cek apakah result field diperlukan
   */
  const validateLocation = async (activityId, locationData) => {
    setIsCheckingDistance(true);
    setError(null);
    
    try {
      const result = await checkLocationDistance(activityId, locationData, token);
      setDistanceData(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to check location';
      setError(errorMsg);
      console.error('Location validation error:', err);
      return null;
    } finally {
      setIsCheckingDistance(false);
    }
  };

  /**
   * Submit activity sebagai done
   */
  const submitActivityDone = async (activityId, payload) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await markActivityAsDone(activityId, payload, token);
      
      if (!result.success) {
        // Jika result required, set error tapi jangan throw
        if (result.status === 422) {
          const errorMsg = `${result.message} (Distance: ${result.distance}m)`;
          setError(errorMsg);
          return {
            success: false,
            requiresResult: true,
            distance: result.distance,
            accuracy: result.accuracy,
            message: result.message
          };
        }
      }
      
      return {
        success: true,
        ...result
      };
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit activity';
      setError(errorMsg);
      console.error('Submit error:', err);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset state
   */
  const resetState = () => {
    setDistanceData(null);
    setError(null);
  };

  return {
    isCheckingDistance,
    isSubmitting,
    distanceData,
    error,
    validateLocation,
    submitActivityDone,
    resetState
  };
};
