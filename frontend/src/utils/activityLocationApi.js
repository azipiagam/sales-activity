// utils/activityLocationApi.js
// API calls untuk location validation dan marking activity as done

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Check location distance dan validasi apakah result field diperlukan
 * @param {string} activityId - ID dari activity plan
 * @param {object} locationData - { plan_lat, plan_lng, current_lat, current_lng, accuracy }
 * @returns {Promise} - { distance, accuracy, result_required, message }
 */
export const checkLocationDistance = async (activityId, locationData, token) => {
  const { plan_lat, plan_lng, current_lat, current_lng, accuracy } = locationData;
  
  try {
    const queryParams = new URLSearchParams({
      plan_lat,
      plan_lng,
      current_lat,
      current_lng,
      ...(accuracy && { accuracy })
    });

    const response = await fetch(
      `${API_BASE_URL}/activity-plans/${activityId}/check-location?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking location distance:', error);
    throw error;
  }
};

/**
 * Mark activity plan as done dengan validasi jarak otomatis
 * @param {string} activityId - ID dari activity plan
 * @param {object} payload - { plan_latitude, plan_longitude, latitude, longitude, accuracy, result? }
 * @returns {Promise} - { message, distance, accuracy }
 */
export const markActivityAsDone = async (activityId, payload, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/activity-plans/${activityId}/done`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Jika 422, artinya result field diperlukan
      if (response.status === 422) {
        return {
          success: false,
          status: 422,
          ...data
        };
      }
      throw new Error(data.message || 'Failed to mark activity as done');
    }

    return {
      success: true,
      status: 200,
      ...data
    };
  } catch (error) {
    console.error('Error marking activity as done:', error);
    throw error;
  }
};

/**
 * Format distance untuk display
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};
