import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

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
      <Typography
        variant="subtitle2"
        sx={{
          color: '#163a6b',
          fontWeight: 700,
          fontSize: '0.92rem',
          mb: 1.1,
        }}
      >
        Hasil (Wajib)
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.25,
          border: '1px solid rgba(22, 58, 107, 0.14)',
          backgroundColor: '#f8fbff',
          px: 1.2,
          py: 0.75,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: 1.5,
        }}
      >
        <DescriptionOutlinedIcon sx={{ color: '#1f4e8c', mt: 0.7, fontSize: 19 }} />
        <InputBase
          multiline
          minRows={3}
          maxRows={5}
          placeholder="Masukkan hasil kunjungan Anda"
          value={result}
          onChange={(e) => onResultChange(e.target.value)}
          disabled={disabled}
          sx={{
            flex: 1,
            color: '#28415f',
            fontSize: '0.94rem',
            lineHeight: 1.45,
            '& .MuiInputBase-input::placeholder': {
              color: '#86a1bc',
              opacity: 1,
            },
          }}
        />
      </Paper>

      <Button
        variant="text"
        startIcon={<PhotoCameraIcon />}
        endIcon={<ChevronRightRoundedIcon />}
        disabled={disabled}
        onClick={onOpenCamera}
        sx={{
          textTransform: 'none',
          px: 0.35,
          py: 1.05,
          width: '100%',
          justifyContent: 'space-between',
          color: '#1b3557',
          fontSize: '0.92rem',
          fontWeight: 600,
          '& .MuiButton-startIcon': {
            color: '#1f4e8c',
            mr: 1.3,
          },
          '& .MuiButton-endIcon': {
            color: '#94a8bf',
            ml: 1.3,
          },
          '&:hover': {
            backgroundColor: 'rgba(31, 78, 140, 0.06)',
          },
        }}
      >
        <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
          Ambil swafoto (opsional)
        </Box>
      </Button>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: '#7d90a8',
          fontSize: '0.74rem',
          ml: 0.6,
          mt: -0.2,
          mb: capturedImage ? 0.7 : 0,
        }}
      >
        Sebagai bukti kunjungan
      </Typography>

      {capturedImage ? (
        <Box
          sx={{
            mt: 0.95,
            position: 'relative',
            display: 'inline-block',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          <img
            src={capturedImage}
            alt="Preview"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '180px',
              borderRadius: '12px',
              border: '1px solid rgba(22, 58, 107, 0.2)',
              boxShadow: '0 6px 14px rgba(10, 28, 53, 0.16)',
            }}
          />
          <IconButton
            onClick={onRemoveImage}
            disabled={disabled}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              p: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#d32f2f',
              border: '1px solid rgba(22, 58, 107, 0.14)',
              boxShadow: '0 2px 6px rgba(10, 28, 53, 0.14)',
              '&:hover': {
                backgroundColor: '#ffffff',
              },
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
