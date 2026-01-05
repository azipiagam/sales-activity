# Frontend Implementation Guide - Activity Location Validation

## Overview

Tiga file baru untuk handle location validation dan marking activity as done:

1. **`utils/activityLocationApi.js`** - API calls wrapper
2. **`hooks/useActivityLocation.js`** - Custom hook untuk state management
3. **`components/ActivityDoneDialog.jsx`** - Complete UI component

---

## File-by-File Explanation

### 1. `utils/activityLocationApi.js`

Wrapper untuk API calls ke backend.

**Functions:**

- **`checkLocationDistance(activityId, locationData, token)`**
  - Calls: `GET /api/activity-plans/{id}/check-location`
  - Returns: `{ distance, accuracy, result_required, message }`

- **`markActivityAsDone(activityId, payload, token)`**
  - Calls: `PUT /api/activity-plans/{id}/done`
  - Handles 422 error untuk result required
  - Returns: `{ success, status, distance, accuracy, message }`

---

### 2. `hooks/useActivityLocation.js`

Custom hook untuk manage location validation dan submission logic.

**Hook State:**
- `isCheckingDistance` - Loading state saat validasi
- `isSubmitting` - Loading state saat submit
- `distanceData` - Result dari distance check
- `error` - Error message

**Hook Functions:**
```javascript
const {
  isCheckingDistance,
  isSubmitting,
  distanceData,
  error,
  validateLocation,    // Validasi jarak
  submitActivityDone,   // Submit dengan jarak
  resetState            // Reset state
} = useActivityLocation(token);
```

---

### 3. `components/ActivityDoneDialog.jsx`

Complete dialog component dengan:
- Get current location via geolocation API
- Check distance sebelum submit
- Conditional render result field (hanya jika distance > 200m)
- Full form validation
- Error handling

---

## Usage Example

### Minimal Implementation

```javascript
import ActivityDoneDialog from './components/ActivityDoneDialog';

function MyActivityComponent() {
  const [openDialog, setOpenDialog] = useState(false);
  const token = localStorage.getItem('token');

  return (
    <>
      <button onClick={() => setOpenDialog(true)}>
        Mark as Done
      </button>

      <ActivityDoneDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        activityId="activity-123"
        planLocation={{ lat: -6.2088, lng: 106.8456 }}
        token={token}
        onSuccess={(result) => {
          console.log('Activity marked as done!', result);
          // Refresh activity list, etc
        }}
      />
    </>
  );
}
```

---

### Custom Implementation (if needed)

Kalau mau buat sendiri tanpa pakai component:

```javascript
import { useActivityLocation } from '../hooks/useActivityLocation';
import { formatDistance } from '../utils/activityLocationApi';

function CustomActivityDone({ activityId, planLocation, token }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const {
    isCheckingDistance,
    isSubmitting,
    distanceData,
    error,
    validateLocation,
    submitActivityDone
  } = useActivityLocation(token);

  // Get location
  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
      }
    );
  };

  // Check distance
  const handleCheckDistance = async () => {
    await validateLocation(activityId, {
      plan_lat: planLocation.lat,
      plan_lng: planLocation.lng,
      current_lat: currentLocation.lat,
      current_lng: currentLocation.lng,
      accuracy: currentLocation.accuracy
    });
  };

  // Submit
  const handleSubmit = async (resultText) => {
    const result = await submitActivityDone(activityId, {
      plan_latitude: planLocation.lat,
      plan_longitude: planLocation.lng,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      accuracy: currentLocation.accuracy,
      result: resultText
    });

    if (result.success) {
      console.log('Success!');
    }
  };

  return (
    <div>
      <button onClick={handleGetLocation}>Get Location</button>
      {currentLocation && <p>Lat: {currentLocation.lat}</p>}

      <button onClick={handleCheckDistance} disabled={!currentLocation}>
        Check Distance
      </button>
      {distanceData && <p>Distance: {formatDistance(distanceData.distance)}</p>}
      {distanceData?.result_required && <input type="text" placeholder="Enter result" />}

      <button onClick={handleSubmit} disabled={!distanceData}>
        Submit
      </button>
    </div>
  );
}
```

---

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Mark as Done"                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Get current location via geolocation API                 │
│    → Get: lat, lng, accuracy                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Call checkLocationDistance()                             │
│    → GET /api/activity-plans/{id}/check-location?...       │
│    ← Response: { distance, result_required, ... }          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ distance > 200m?     │
        └──────────┬───────────┘
          Yes      │      No
            │      │      │
            ▼      ▼      ▼
      ┌─────────────────────────┐
      │ Show result input field │
      │ (or hide if No)         │
      └──────────┬──────────────┘
                 │
                 ▼
     ┌─────────────────────────┐
     │ User fills form & clicks│
     │ "Mark as Done"          │
     └──────────┬──────────────┘
                │
                ▼
     ┌─────────────────────────┐
     │ Call markActivityAsDone()│
     │ → PUT /api/activity-... │
     │ ← Response: { success } │
     └──────────┬──────────────┘
                │
                ▼
     ┌─────────────────────────┐
     │ Success! Close dialog   │
     │ Refresh activity list   │
     └─────────────────────────┘
```

---

## Error Handling

### Case 1: Distance > 200m, result field kosong

API return 422:
```json
{
  "message": "Result is required for distance > 200 meters",
  "distance": 250.75,
  "accuracy": 15
}
```

Hook handle: Set state ke `{ success: false, requiresResult: true, ... }`

FE show: "Result field wajib diisi karena jarak > 200 meter"

---

### Case 2: Geolocation denied

Browser geolocation error:
```javascript
navigator.geolocation.getCurrentPosition(
  success,
  (error) => {
    // error.message: "User denied geolocation"
  }
);
```

FE show: Alert dengan error message

---

### Case 3: Network error

API call error:
```javascript
const submitResult = await submitActivityDone(...);
// submitResult: { success: false, error: "Network timeout" }
```

FE show: Error alert di dialog

---

## Integration Checklist

- [ ] Copy 3 files ke frontend (`utils`, `hooks`, `components`)
- [ ] Update `.env` dengan `REACT_APP_API_URL` jika needed
- [ ] Import `ActivityDoneDialog` di component yang tepat
- [ ] Test get location (perlu HTTPS atau localhost)
- [ ] Test dengan distance < 200m (result optional)
- [ ] Test dengan distance > 200m (result required)
- [ ] Test dengan geolocation denied
- [ ] Test network error handling
