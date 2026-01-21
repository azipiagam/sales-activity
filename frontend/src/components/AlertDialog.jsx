// React
import React from 'react';

// Material-UI Components
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

// Material-UI Icons
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotesIcon from '@mui/icons-material/Notes';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * AlertDialog Component - Snackbar-style alert with field-specific icons
 *
 * Displays centered alerts with appropriate icons based on field type and severity.
 * Icons are automatically selected based on the fieldType parameter.
 *
 * @param {boolean} open - Whether the alert is visible
 * @param {function} onClose - Callback when alert is closed
 * @param {string} message - Alert message content (centered)
 * @param {string} severity - Alert severity: 'error', 'warning', 'info', 'success'
 * @param {string} fieldType - Field type for specific icons: 'date', 'customer', 'location', 'tujuan', 'keterangan'
 * @param {number} autoHideDuration - Auto-hide duration in milliseconds (default: 6000)
 * @param {boolean} showCloseButton - Whether to show close button (default: true)
 */

const AlertDialog = ({
  open,
  onClose,
  message,
  severity = 'info',
  fieldType, // 'date', 'customer', 'location', 'tujuan', 'keterangan'
  autoHideDuration = 6000,
  showCloseButton = true
}) => {
  /**
   * Handle alert close event
   * Prevents closing on clickaway to maintain user focus
   */
  const handleClose = (event, reason) => {
    // Don't close on clickaway to prevent accidental dismissal
    if (reason === 'clickaway') {
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  /**
   * Get appropriate icon based on severity and field type
   * @returns {React.Component} Icon component
   */
  const getIcon = () => {
    // Always show success icon for success severity
    if (severity === 'success') {
      return <CheckCircleIcon fontSize="small" />;
    }

    // For error severity, use field-specific icons
    if (severity === 'error' && fieldType) {
      switch (fieldType) {
        case 'date':
          return <CalendarTodayIcon fontSize="small" />; // 📅 Calendar
        case 'customer':
          return <PersonIcon fontSize="small" />; // 👤 Person
        case 'location':
          return <LocationOnIcon fontSize="small" />; // 📍 Location/Map marker
        case 'tujuan':
          return <AssignmentIcon fontSize="small" />; // 📋 Assignment
        case 'keterangan':
          return <NotesIcon fontSize="small" />; // 📝 Notes
        default:
          return <ErrorIcon fontSize="small" />; // ⚠️ General error
      }
    }

    // Default icons for other severities
    switch (severity) {
      case 'warning':
        return <WarningIcon fontSize="small" />;
      case 'info':
        return <InfoIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{
        '& .MuiSnackbarContent-root': {
          minWidth: '300px',
          maxWidth: '500px',
        },
      }}
    >
      <Alert
        severity={severity}
        icon={getIcon()}
        action={
          showCloseButton ? (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
              sx={{
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null
        }
        sx={{
          width: '100%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
          // Center align icon vertically
          '& .MuiAlert-icon': {
            alignItems: 'center',
            marginTop: '2px', // Fine-tune icon positioning
          },
          // Center align message content
          '& .MuiAlert-message': {
            padding: '6px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
          },
          // Adjust action button padding
          '& .MuiAlert-action': {
            padding: '0 0 0 8px',
            margin: 0,
            alignSelf: 'flex-start',
          },
        }}
      >
        {/* Message content - centered */}
        <Box
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '24px', // Ensure consistent height
          }}
        >
          {message}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default AlertDialog;
