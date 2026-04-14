import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';

const ICON_BY_TYPE = {
  info: {
    icon: InfoOutlinedIcon,
    color: '#1976d2',
    background: 'rgba(25, 118, 210, 0.12)',
  },
  warning: {
    icon: WarningAmberRoundedIcon,
    color: '#ed6c02',
    background: 'rgba(237, 108, 2, 0.12)',
  },
  error: {
    icon: ErrorOutlineRoundedIcon,
    color: '#d32f2f',
    background: 'rgba(211, 47, 47, 0.12)',
  },
  success: {
    icon: CheckCircleOutlineRoundedIcon,
    color: '#2e7d32',
    background: 'rgba(46, 125, 50, 0.12)',
  },
  locationSuccess: {
    icon: LocationOnRoundedIcon,
    color: '#2e7d32',
    background: 'rgba(46, 125, 50, 0.14)',
  },
};

export default function PopupValidationDone({
  open,
  title = 'Informasi',
  message = '',
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Batal',
  showCancel = false,
  disableBackdropClose = false,
  onConfirm,
  onCancel,
}) {
  const iconConfig = ICON_BY_TYPE[type] || ICON_BY_TYPE.info;
  const IconComponent = iconConfig.icon;
  const isPlainMessage = typeof message === 'string';

  const handleClose = (_, reason) => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="done-validation-popup-title"
      aria-describedby="done-validation-popup-message"
    >
      <DialogTitle
        id="done-validation-popup-title"
        sx={{
          pb: 1.5,
          pt: 2.5,
          px: 2.5,
          borderBottom: '1px solid rgba(17, 24, 39, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconConfig.color,
              backgroundColor: iconConfig.background,
              flexShrink: 0,
            }}
          >
            <IconComponent fontSize="small" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: type === 'locationSuccess' ? '#166534' : '#1f2937',
              fontSize: '1.05rem',
            }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pt: 1.75 }}>
        {isPlainMessage ? (
          <DialogContentText
            id="done-validation-popup-message"
            sx={{
              color: '#374151',
              fontSize: '0.94rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-line',
            }}
          >
            {message}
          </DialogContentText>
        ) : (
          <Box
            id="done-validation-popup-message"
            sx={{
              color: '#374151',
              fontSize: '0.94rem',
              lineHeight: 1.55,
            }}
          >
            {message}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.25, pt: 0.5 }}>
        {showCancel ? (
          <Button
            onClick={onCancel}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              borderColor: 'var(--theme-blue-primary)',
              color: 'var(--theme-blue-primary)',
              '&:hover': {
                borderColor: 'var(--theme-blue-overlay)',
                backgroundColor: 'rgba(35, 106, 179, 0.08)',
              },
            }}
          >
            {cancelText}
          </Button>
        ) : null}
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            color: '#fff',
            background:
              'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            '&:hover': {
              background:
                'linear-gradient(135deg, var(--theme-blue-overlay) 0%, var(--theme-blue-primary) 100%)',
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
