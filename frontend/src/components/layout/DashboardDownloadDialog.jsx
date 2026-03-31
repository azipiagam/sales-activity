import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { DASHBOARD_EXPORT_PERIOD_OPTIONS } from '../../constants/dashboardPeriods';

export default function DashboardDownloadDialog({
  open,
  onClose,
  onConfirm,
  provinceLabel = 'Semua Provinsi',
  isDownloading = false,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSelectedPeriod('');
    setErrorMessage('');
  }, [open]);

  const handleClose = () => {
    if (isDownloading) {
      return;
    }

    setSelectedPeriod('');
    setErrorMessage('');

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedPeriod) {
      setErrorMessage('Pilih periode download terlebih dahulu.');
      return;
    }

    try {
      const result = await onConfirm?.(selectedPeriod);

      if (result?.ok === false) {
        setErrorMessage(result.message || 'File gagal disiapkan. Coba lagi dalam beberapa saat.');
        return;
      }

      handleClose();
    } catch (error) {
      setErrorMessage('File gagal disiapkan. Coba lagi dalam beberapa saat.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px', sm: '24px' },
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFE 100%)',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2.25, sm: 2.75 },
          pt: { xs: 2.25, sm: 2.75 },
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(107, 163, 208, 0.18) 0%, rgba(107, 163, 208, 0.08) 100%)',
              border: '1px solid rgba(107, 163, 208, 0.18)',
              flexShrink: 0,
            }}
          >
            <FileDownloadOutlinedIcon sx={{ color: '#6BA3D0', fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: { xs: '1rem', sm: '1.08rem' },
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
              }}
            >
              Download Dashboard
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: { xs: '0.8rem', sm: '0.84rem' },
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Pilih periode export terlebih dahulu sebelum file diunduh.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.25, sm: 2.75 }, pb: 2 }}>
        <Box
          sx={{
            mb: 1.75,
            p: 1.4,
            borderRadius: '18px',
            backgroundColor: 'rgba(107, 163, 208, 0.08)',
            border: '1px solid rgba(107, 163, 208, 0.16)',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Provinsi aktif
          </Typography>
          <Typography
            sx={{
              mt: 0.45,
              fontSize: { xs: '0.92rem', sm: '0.96rem' },
              fontWeight: 600,
              color: '#111827',
              lineHeight: 1.35,
            }}
          >
            {provinceLabel}
          </Typography>
        </Box>

        <RadioGroup value={selectedPeriod} onChange={handlePeriodChange}>
          {DASHBOARD_EXPORT_PERIOD_OPTIONS.map((option) => {
            const isSelected = selectedPeriod === option.value;

            return (
              <Box
                key={option.value}
                sx={{
                  mb: 1,
                  borderRadius: '18px',
                  border: isSelected
                    ? '1px solid rgba(107, 163, 208, 0.45)'
                    : '1px solid rgba(17, 24, 39, 0.08)',
                  backgroundColor: isSelected ? 'rgba(107, 163, 208, 0.08)' : '#FFFFFF',
                  boxShadow: isSelected
                    ? '0 10px 24px rgba(107, 163, 208, 0.14)'
                    : '0 4px 14px rgba(15, 23, 42, 0.04)',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    borderColor: 'rgba(107, 163, 208, 0.28)',
                    boxShadow: '0 10px 24px rgba(107, 163, 208, 0.10)',
                  },
                }}
              >
                <FormControlLabel
                  value={option.value}
                  control={
                    <Radio
                      disableRipple
                      sx={{
                        mt: 0.15,
                        color: 'rgba(107, 163, 208, 0.5)',
                        '&.Mui-checked': {
                          color: '#6BA3D0',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ py: 0.4 }}>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.92rem', sm: '0.96rem' },
                          fontWeight: 700,
                          color: '#111827',
                          lineHeight: 1.25,
                        }}
                      >
                        {option.value}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: { xs: '0.78rem', sm: '0.8rem' },
                          color: '#6B7280',
                          lineHeight: 1.45,
                        }}
                      >
                        {option.description}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    m: 0,
                    px: 1.25,
                    py: 0.9,
                    width: '100%',
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': {
                      width: '100%',
                    },
                  }}
                />
              </Box>
            );
          })}
        </RadioGroup>

        {errorMessage ? (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#DC2626',
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.25, sm: 2.75 },
          pb: { xs: 2.25, sm: 2.75 },
          pt: 0.75,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isDownloading}
          variant="outlined"
          sx={{
            minWidth: 110,
            borderRadius: '14px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'rgba(17, 24, 39, 0.12)',
            color: '#4B5563',
          }}
        >
          Batal
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isDownloading}
          variant="contained"
          disableElevation
          startIcon={
            isDownloading
              ? <CircularProgress size={16} color="inherit" />
              : <FileDownloadOutlinedIcon />
          }
          sx={{
            minWidth: 138,
            borderRadius: '14px',
            textTransform: 'none',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6BA3D0 0%, #4E8FC2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5C97C7 0%, #437EAF 100%)',
            },
          }}
        >
          {isDownloading ? 'Menyiapkan...' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
