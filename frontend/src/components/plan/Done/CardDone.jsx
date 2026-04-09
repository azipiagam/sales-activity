import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

export default function CardDone({
  result,
  onResultChange,
  capturedImage,
  onOpenCamera,
  onRemoveImage,
  disabled = false,
}) {
  return (
    <>
      <Box
        sx={{
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 0.5,
        }}
      >
        <FormatListBulletedRoundedIcon sx={{ color: '#7a7a7a' }} />
        <InputBase
          multiline
          maxRows={3}
          placeholder="Result (wajib diisi)"
          value={result}
          onChange={(e) => onResultChange(e.target.value)}
          disabled={disabled}
          sx={{
            flex: 1,
            color: '#4c4c4c',
            fontSize: { xs: '1rem', sm: '1.05rem' },
            '& .MuiInputBase-input::placeholder': {
              color: '#8a8a8a',
              opacity: 1,
            },
          }}
        />
      </Box>

      <Box sx={{ height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.08)', my: 0.5 }} />

      <Button
        variant="text"
        startIcon={<PhotoCameraIcon />}
        endIcon={<ChevronRightRoundedIcon />}
        disabled={disabled}
        onClick={onOpenCamera}
        sx={{
          textTransform: 'none',
          px: 0.5,
          py: 1.2,
          width: '100%',
          justifyContent: 'space-between',
          color: '#6e6e6e',
          fontSize: { xs: '1rem', sm: '1.05rem' },
          '& .MuiButton-startIcon': {
            color: '#7a7a7a',
            mr: 1.5,
          },
          '& .MuiButton-endIcon': {
            color: '#9b9b9b',
            ml: 1.5,
          },
          '&:hover': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
          Ambil swafoto (opsional)
        </Box>
      </Button>

      {capturedImage ? (
        <Box sx={{ mt: 1.25, position: 'relative', display: 'inline-block' }}>
          <img
            src={capturedImage}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '220px',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.15)',
            }}
          />
          <IconButton
            onClick={onRemoveImage}
            disabled={disabled}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              color: '#d32f2f',
            }}
            aria-label="Hapus foto"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
    </>
  );
}
